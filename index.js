const express=require('express');
const app=express()
const port =4000
app.get('/twitter',(req,res)=>{
    res.send('Hello Twitter!'); // also h1 tag work here in quotes.
}) //GET API route.
app.listen(port,()=>{
    console.log(`Server is running on port ${port}`);
}) //server listening on port 4000