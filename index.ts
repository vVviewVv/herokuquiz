import express from 'express'
import fs from 'fs'
import bodyParser from 'body-parser'
import cors from 'cors'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { body, query, validationResult } from 'express-validator'

interface DbSchema {
  users: User[]
}
interface User {
  username: string
  password: string
  firstname: string
  lastname: string
  balance: number
}
interface JWTPayload {
  username: string;
}
const readDbFile = (): DbSchema => {
  const raw = fs.readFileSync('db.json', 'utf8')
  const db: DbSchema = JSON.parse(raw)
  return db
}

const app = express()
app.use(bodyParser.json())
app.use(cors())
const PORT = process.env.PORT || 3000
const SECRET = "SIMPLE_SECRET"
const info = require("./user_info");



app.post("/register", (req, res) => {
  console.log(req.body);
  const { username, password, firstname, lastname, balance } = req.body;
  if (
    username !== undefined &&
    password !== undefined &&
    firstname !== undefined &&
    lastname !== undefined &&
    balance !== undefined
  ){  const newInfo = {
      username : username ,
      password: password,
      firstname: firstname,
      lastname: lastname,
      balance: balance
    };
    info.info.push(newInfo);
    res.status(200).send({ success: true, message: "Register successfully" });
  }else{
    res . status ( 400 ) . send ( {  success : false ,  message: "Username is already in used"  } ) ;
  }
});

app.post('/login',
  (req, res) => {

    const { username, password } = req.body
    // Use username and password to create token.
    const user = info.users.find((data : any) => data.username === username)
    if (!user) {
      return res.status(400).json({ message: 'Invalid username or password' })
    }
    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(400).json({ message: 'Invalid username or password' })
     
    }
    const token = jwt.sign({username : user.username,password : user.password } as JWTPayload , SECRET)
    return res.status(200).json({ message:"Login successfully", token})
  })

  app.get('/balance',
  (req, res) => {
    const token = req.query.token as string
    try {
      const { username } = jwt.verify(token, SECRET) as JWTPayload
      const db = readDbFile()
      const reqUser = db.users.find(user => user.username === username)
      res.status(200).json({name: reqUser?.firstname + " " + reqUser?.lastname,balance: reqUser?.balance})
    }
    catch (e) {
      //response in case of invalid token
      res.status(401).json({
        message : "Invalid token"
      })
    }
  })

app.post('/deposit',
  (req, res) => {
    try{
      const {amount} = req.body
      const db = readDbFile()
      //Is amount <= 0 ?
      if (amount <= 0)
      return res.status(400).json({ message: "Invalid data" })

      const token: string = req.query.token as string
      const { username } = jwt.verify(token, SECRET) as JWTPayload
      const reqUser = db.users.find(user => user.username === username)
      if(reqUser){
        reqUser.balance = reqUser.balance + amount
        fs.writeFileSync("db.json", JSON.stringify(db,null,2))
        return res.status(200).json({
            message: "Deposit successfully",
            balance: reqUser?.balance 
        })
      }
      res.status(404).json({message:"USER NOT FOUND"})
    }catch(e){
      res.status(401).json({
        message : "Invalid token"
      })
    }
  })

app.post('/withdraw',(req, res) => {
  const token = req.headers.authorization
    const amount = req.body.amount
    if(amount<=0){
      if (!validationResult(req).isEmpty())
        return res.status(400).json({ message: "Invalid data" })
      return res.status(400).json({ message: "Invalid data" })
    }
    if (!token) {
      res.status(401)
      res.json({ message: 'Invalid token'})
      return
    }
    const { username } = jwt.verify(token, SECRET) as JWTPayload
    const balance = info.find(user=>user.username===username)?.balance
    const newbalance = balance - amount
    if(newbalance<0){
      res.status(400)
      res.json({
        message:'Invalid data'
      })
      return
    }
    
    res.status(200)
    res.json({ 
      message: 'Withdraw sucessfully',
      balance: newbalance
    })

});

app.delete('/reset', (req, res) => {
  return res.status(200).json({
    message: 'Reset database successfully'
  })
});

app.get("/me", (req, res) => {
  res.status(200).json({
    firstname: "Lakkhanan",
    lastname: "Issara",
    code: "620610805",
    gpa: 2.96
  })
})

app.get('/demo', (req, res) => {
  return res.status(200).json({
    message: 'This message is returned from demo route.'
  })
})
app.get('/', (req, res) => {
  return res.status(200).json({
    message: 'test.'
  })
})

app.listen(PORT, () => console.log(`Server is running at ${PORT}`));