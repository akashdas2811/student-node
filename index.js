import express from "express"
import path from "path"
import bodyParser from "body-parser"
import dotenv from "dotenv"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"
import { userSchema } from "./model/user.Schema.js"
import { LocalStorage } from "node-localstorage"
import  bcrypt from "bcrypt"
import nodemailer from "nodemailer"
import { exit } from "process"
dotenv.config()

mongoose.set('strictQuery',false);
mongoose.connect(process.env.DATABASE_URL,{
    useNewUrlParser: true, 
    useUnifiedTopology: true,
    family: 4,
}).then(()=>{
    console.log("The database is connected");
})



let localStorage = new LocalStorage('./scratch')

const app = express()
app.use(bodyParser.urlencoded({extended:false}))
app.use(bodyParser.json())
const __dirname = path.resolve(path.dirname(''))
app.set('view engine', 'ejs'); 
app.get('/',(req,res)=>{
    let key = process.env.JWT_SECRET_KEY;
    if (localStorage.getItem("token")!=null) {
        let tok = localStorage.getItem("token");
        try {
            if (jwt.verify(tok,key)) {
                let userid = jwt.verify(tok,key).id;
                const userModel = mongoose.model('user',userSchema)
                userModel.findById(userid).then((info)=>{
                    console.log(info)
                    res.render("home",{name:info.Firstname+" "+info.Lastname})
                }).catch((er)=>{
                    console.log(er);
                    res.redirect("/login");
                })
            } else {
                
                console.log("Token invalid")
                res.send("Token Invalid")
                localStorage.removeItem("token")            
    
            }
        } catch (error) {
                console.log("Token invalid")
                res.send("Token Invalid")
        }
        
    }
    else
    {
        res.redirect('/login');
    }
    

})
app.get('/logout',(req,res)=>{
    localStorage.removeItem("token")            
    res.redirect("/login")
})
app.get('/login',(req,res)=>{
    res.render("login")
})
app.get('/resgistation',(req,res)=>{
    res.render("ragistration")
})
app.post('/login', (req,res)=>{
    const un = req.body.username
    const pass = req.body.password
    const userModel = mongoose.model('user',userSchema)
    userModel.findOne({EmailID:req.body.username}).then(async(EL)=>{
        if(EL==null)
        {
           console.log("user not present")
        }
        else
        {
            console.log(EL);
            if(EL.EmailID==un)
            {
                const info = await bcrypt.compare(pass,EL.password);
                console.log(info)
                if(info)
                {
                    let key = process.env.JWT_SECRET_KEY;
                    let data = {
                        "id":EL._id,
                        "time":new Date().getTime()
                    }
                    let signopt = {
                        expiresIn:"10d"
                    }
                    const token = jwt.sign(data,key,signopt)
                    localStorage.setItem("token",token)
                    console.log("your name is verified and token is "+token)
                    res.redirect('/')
        
                }
                else
                {
                    console.log("password wrong")
                    res.send("password wrong")
                }
            }
            else{
                console.log("user not present")
                res.send("user not present")
            }
        }
    })
})
app.post('/registration', (req,res)=>{
    const userModel = mongoose.model('user',userSchema)
    userModel.findOne({EmailID:req.body.EmailID}).then(async(val)=>{
        if(val==null)
        {
            let value = req.body;
            const hashpwd = async (password,saltRounds = 10) =>{
                try {
                    const salt = await bcrypt.genSalt(saltRounds)
                    return await bcrypt.hash(password,salt)
                } catch (error) {
                    console.log(error)
                    return password
                }
                return null
            };
            value.password = await hashpwd(req.body.password);
            const user = new userModel(value);
            await user.save()
            console.log(user)
            res.redirect('/login')
        }
        else
        {
            console.log("User alredy present");
        }
    })
    
})
app.get('/sendmail',async(req,res)=>{
    
    let transport = nodemailer.createTransport({
        host:"smtp.gmail.com",
        port: 587,
        secure: false,
        auth:{
            user: "nodejstest268@gmail.com",
            pass: "somxteygbgawccno"
        }
    })
    let sendmail = await transport.sendMail({
        from:"nodejstest268@gmail.com",
        to:"subhankar0810@gmail.com",
        subject: "This is a test message from me",
        text:"This a testing message",
        html:"<h1>This is heading</h1>",
    })
    console.log(sendmail.messageId);
});
app.listen(3026,()=>{
    console.log("server start in http://localhost:3026");
})