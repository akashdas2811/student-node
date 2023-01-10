import express from "express"
import path from "path"
import bodyParser from "body-parser"
import dotenv from "dotenv"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"
import { userSchema } from "./model/user.Schema.js"
import { LocalStorage } from "node-localstorage"
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
                if(EL.password==pass)
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
            const user = new userModel(req.body);
            await user.save()
            console.log(user)
        }
        else
        {
            console.log("User alredy present");
        }
    })
    res.send()
    
})
app.listen(3026,()=>{
    console.log("server start in http://localhost:3026");
})