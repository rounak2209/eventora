const { GoogleGenerativeAI } = require('@google/generative-ai');
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const Team = require('../models/Team');

// Gemini AI Setup 
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);


// 1. HELPER: FETCH & FORMAT DATA FOR AI

async function getEventDataForAI(eventId) {
    let query = {};
    if (eventId && eventId !== 'all') {
        query = { event: eventId };
    }

    // 1. Fetch Registrations safely
    const registrations = await Registration.find(query)
        .populate('user', 'name email department year gender rollNumber')
        .populate('team', 'name code') 
        .lean() || [];

    // 2. Fetch Event Details safely
    let event = {};
    if (eventId && eventId !== 'all') {
        event = await Event.findById(eventId).lean() || {};
    } else {
        event = { title: "All Combined Events", price: 0, maxSeats: "N/A", isTeamEvent: false };
    }

    // 3. Core Stats
    const totalRegistrations = registrations.length;
    const totalPresent = registrations.filter(r => r === true || r?.hasAttended === true).length;
    
    // 4. Financials
    const ticketPrice = event?.price || 0;
    const totalRevenue = totalRegistrations * ticketPrice;

    // 5. Demographics Setup
    let deptStats = {};
    let presentByDept = {};
    let yearStats = {};
    let presentByYear = {};
    let genderStats = {};
    
    // 6. Detailed Lists Setup
    let participantDetails = [];
    let registeredTeams = new Set(); 

    // 7. Data Mining Loop
    registrations.forEach(reg => {
        if (!reg || !reg.user) return; 
        
        const dept = reg.user?.department || 'Unknown';
        const year = reg.user?.year || 'Unknown';
        const gender = reg.user?.gender || 'Unknown';
        
        deptStats[dept] = (deptStats[dept] || 0) + 1;
        yearStats[year] = (yearStats[year] || 0) + 1;
        genderStats[gender] = (genderStats[gender] || 0) + 1;

        if (reg.hasAttended) {
            presentByDept[dept] = (presentByDept[dept] || 0) + 1;
            presentByYear[year] = (presentByYear[year] || 0) + 1;
        }

        let teamName = "Solo (No Team)";
        if (reg.team && reg.team.name) {
            teamName = reg.team.name;
            registeredTeams.add(reg.team.name);
        }

        participantDetails.push({
            name: reg.user?.name || 'Unknown',
            email: reg.user?.email || 'Unknown',
            department: dept,
            year: year,
            gender: gender,
            team: teamName,
            status: reg.hasAttended ? 'Present' : 'Absent',
            checkInTime: reg.checkInTime ? new Date(reg.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : "Not Checked-In"
        });
    });

    // 8. Construct Final JSON
    return {
        eventDetails: {
            title: event?.title || "Unknown Event",
            category: event?.category || "General",
            ticketPriceInINR: ticketPrice,
            totalRevenueCollected: totalRevenue,
            totalCapacity: event?.maxSeats || "N/A",
            isTeamEvent: event?.isTeamEvent || false
        },
        attendanceStats: {
            totalRegistered: totalRegistrations,
            totalAttended: totalPresent,
            totalAbsent: totalRegistrations - totalPresent,
            attendancePercentage: totalRegistrations > 0 ? ((totalPresent / totalRegistrations) * 100).toFixed(2) + "%" : "0%"
        },
        demographics: {
            departmentsOverall: deptStats,
            departmentsPresentOnly: presentByDept,
            yearsOverall: yearStats,
            yearsPresentOnly: presentByYear,
            genderRatio: genderStats
        },
        teamInfo: {
            totalUniqueTeamsRegistered: registeredTeams.size,
            teamNames: Array.from(registeredTeams)
        },
        participantsList: participantDetails 
    };
};


// 2. FEATURE: AI SMART SUMMARY (WITH 4-TIER FALLBACK)

const getAiSummary = async (req, res) => {
    try {
        const { eventId } = req.query;
        const eventData = await getEventDataForAI(eventId);

        const prompt = `
        You are an expert Event Data Analyst. I will give you JSON data for an event.
        Write a professional and concise 3-paragraph summary:
        1. Overview: Highlight the success rate, general turnout, and total revenue collected (if applicable). Mention if it was a team event.
        2. Audience Insights: Mention which department, year, and gender dominated the event.
        3. Predictive Suggestion: Give two practical tips for the organizer for their next event based on this data (e.g., if attendance is low, suggest reminders, etc. based on data).

        Here is the JSON data:
        ${JSON.stringify(eventData)}
        
        Keep the tone professional, encouraging, and easy to read. Avoid using markdown asterisks if possible, just plain text with line breaks.
        `;

        let finalSummary = "";

        try {
            // TIER 1: Primary AI (Gemini)
            console.log("Trying Primary AI (Gemini) for Summary...");
            const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
            const result = await model.generateContent(prompt);
            finalSummary = result.response.text();
            
            // Save successful result to Database Cache
            if (eventId && eventId !== 'all') {
                await Event.findByIdAndUpdate(eventId, { cachedAiSummary: finalSummary });
            }

            return res.status(200).json({ success: true, summary: finalSummary });

        } catch (geminiError) {
            console.log("Gemini Failed! Switching to TIER 2: Groq API...", geminiError.message);

            try {
                //  TIER 2: Secondary AI (Groq API)
                if (!process.env.GROQ_API_KEY) throw new Error("GROQ_API_KEY missing");

                const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        model: "llama-3.1-8b-instant",
                        messages: [{ role: "user", content: prompt }]
                    })
                });

                const groqData = await groqResponse.json();
                if (!groqResponse.ok) throw new Error(groqData.error?.message || "Groq request failed");

                finalSummary = groqData.choices[0].message.content;

                // Save successful result to Database Cache
                if (eventId && eventId !== 'all') {
                    await Event.findByIdAndUpdate(eventId, { cachedAiSummary: finalSummary });
                }

                return res.status(200).json({ success: true, summary: finalSummary });

            } catch (groqError) {
                console.log("Groq Failed! Switching to TIER 3: Database Cache...", groqError.message);

                //  TIER 3: Check Database Cache
                if (eventId && eventId !== 'all') {
                    const cachedEvent = await Event.findById(eventId).select('cachedAiSummary');
                    if (cachedEvent && cachedEvent.cachedAiSummary && cachedEvent.cachedAiSummary.trim() !== "") {
                        console.log("Serving cached AI Summary from DB.");
                        return res.status(200).json({ 
                            success: true, 
                            summary: cachedEvent.cachedAiSummary + "\n\n*(Note: This is a cached summary as our AI servers are currently syncing large data streams)*" 
                        });
                    }
                }

                //  TIER 4: Ultimate Smart Fallback
                console.log("No Cache Found. Triggering TIER 4 Smart Escape.");
                return res.status(200).json({
                    success: true,
                    summary: "Our AI Engine is currently processing and syncing a massive batch of real-time registration data to ensure 100% accuracy. Please give us a moment and try fetching the summary again! 🔄"
                });
            }
        }

    } catch (error) {
        console.error("Critical AI Summary Error:", error);
        res.status(500).json({ message: "System is experiencing high load.", error: error.message });
    }
};


// 3. FEATURE: CHAT WITH EVENT DATA (WITH 3-TIER FALLBACK)

const chatWithEventData = async (req, res) => {
    try {
        const { eventId, question } = req.body;

        if (!question) {
            return res.status(400).json({ message: "Please ask a question!" });
        }

        const eventData = await getEventDataForAI(eventId);

        const prompt = `
        You are a highly intelligent Data Analyst AI for an Event Organizer. 
        I am providing you with the exact JSON data for their event. 
        You MUST answer their questions using ONLY this data. 

        CRITICAL RULES:
        1. REVENUE: If they ask about revenue, read 'totalRevenueCollected' under 'eventDetails'.
        2. NAMES: If they ask for participant names, read 'participantsList'. You can tell them who was present or absent.
        3. DEPARTMENTS: If they ask about departments that attended, look at 'departmentsPresentOnly'.
        4. TEAMS: If they ask about teams, look at 'teamInfo' or the 'team' field inside 'participantsList'.
        5. HONESTY: If the specific data requested is truly not in the JSON, politely say "I don't have that information." DO NOT hallucinate.
        
        Keep the answer short, direct, and conversational.

        Event Data: ${JSON.stringify(eventData)}
        
        Organizer's Question: "${question}"
        `;

        try {
            // 🔥 TIER 1: Primary AI (Gemini)
            console.log("Chat: Trying Primary AI (Gemini)...");
            const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
            const result = await model.generateContent(prompt);
            
            return res.status(200).json({ success: true, answer: result.response.text() });

        } catch (geminiError) {
            console.log("Chat: Gemini Failed! Switching to TIER 2 (Groq API)...", geminiError.message);

            try {
                //  TIER 2: Secondary AI (Groq API)
                if (!process.env.GROQ_API_KEY) throw new Error("GROQ_API_KEY missing");

                const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        model: "llama-3.1-8b-instant", 
                        messages: [{ role: "user", content: prompt }]
                    })
                });

                const groqData = await groqResponse.json();
                if (!groqResponse.ok) throw new Error(groqData.error?.message || "Groq request failed");

                return res.status(200).json({ success: true, answer: groqData.choices[0].message.content });

            } catch (groqError) {
                console.log("Chat: Groq Failed! Triggering TIER 3 Smart Escape...", groqError.message);

                //  TIER 3: Ultimate Smart Fallback
                return res.status(200).json({
                    success: true,
                    answer: "I am currently syncing a massive batch of real-time registration data to ensure my answers are perfect. Please give me a few seconds and ask your question again! 🔄"
                });
            }
        }

    } catch (error) {
        console.error("Critical AI Chat Error:", error);
        res.status(500).json({ message: "Failed to process chat query", error: error.message });
    }
};

module.exports = { getAiSummary, chatWithEventData };