const {ObjectId} = require("mongodb");
const jwt= require("jsonwebtoken");
const {Todo} = require( "./../../models/todo");
const {User} = require("./../../models/user");

const userOneId=new ObjectId();
const userTwoId=new ObjectId();
const users=[{
  _id:userOneId,
  email:"albert@hotmail.com",
  password:"userOnePass",
  tokens:[{
    access:"auth",
    token: jwt.sign({_id:userOneId,access:"auth"},process.env.JWT_SECRET).toString()
  }]
},{
  _id:userTwoId,
  email:"alboop@gmail.com",
  password:"userTwoPass",
  tokens:[{
    access:"auth",
    token: jwt.sign({_id:userTwoId,access:"auth"},process.env.JWT_SECRET).toString()
  }]
}];

const todos=[{
  _id:new ObjectId(),
  text:"first td",
  completed:false,
  _creator: userOneId
},{
  _id:new ObjectId(),
  text:"second td",
  completed:true,
  completedAt:1245324635,
  _creator: userTwoId
}];

const populateTodos= (done) =>{
  Todo.remove({}).then(()=> {
    return Todo.insertMany(todos);
  }).then(()=>done());
};

const populateUsers= (done)=>{
  User.remove({}).then(()=>{
    let userOne= new User(users[0]).save();
    let userTwo= new User(users[1]).save();

    return Promise.all([userOne,userTwo]);
  }).then(()=> done());
};

module.exports={todos,populateTodos,users,populateUsers};
//
