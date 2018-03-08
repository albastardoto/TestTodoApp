require("./config/config.js");

const _=require("lodash");
var express= require("express");
var bodyParser = require("body-parser");
var {ObjectId} = require("mongodb");

var {mongoose}= require("./db/mongoose")
var {Todo}=require("./models/todo");
var {User}=require("./models/user");
let {authenticate}=require("./middleware/authenticate");
var app = express();
const port = process.env.PORT;
app.use(bodyParser.json());

app.post("/todos",(req,res)=>{
  var todo = new Todo({
    text:req.body.text
  });
  todo.save().then((doc)=>{
    res.status(200).send(doc);
  }, (e)=>{
      res.status(400).send(e);
  });
});

app.get("/todos",(req,res)=>{
  Todo.find().then((todos)=>{
    res.send({
      todos,
      specialCode:"nothing"
    });
  },(e)=>{
    res.status(400).send(e);
  });
});
app.get("/todos/:id",(req,res)=>{
  let id=req.params.id;
  if(!ObjectId.isValid(id)){
    return res.status(404).send();
  }
  Todo.findById(id).then((todo)=>{
    if(!todo){
      return res.status(404).send();
    }
    res.send({todo});
  }).catch((e)=>{
    res.status(400).send(e);
  })
});

app.delete("/todos/:id",(req,res)=>{
  let id = req.params.id;
  if(!ObjectId.isValid(id)){
    return res.status(404).send();
  }
  Todo.findByIdAndRemove(id).then((todo)=>{
    if(!todo){
      return res.status(404).send();
    }
    res.send({todo});
  }).catch((e)=>{
    res.status(400).send(e);
  });
});

app.patch("/todos/:id",(req,res)=>{
  let id = req.params.id;
  let body =_.pick(req.body,["text","completed"])
  if(!ObjectId.isValid(id)){
    return res.status(404).send();
  }
  if(_.isBoolean(body.completed)){
    if(body.completed){
      body.completedAt = new Date().getTime();
    }else{
      body.completedAt=null;
      body.completed=false;
    }
  }
  Todo.findByIdAndUpdate(id, {$set: body},{new:true}).then((todo)=>{
    if(!todo){
      return res.status(404).send();
    }
    return res.send({todo});
  }).catch((e)=>res.status(400).send(e));
});

// USERS ------------------------------------------------------------------------------------------------

app.post("/users",(req,res)=>{
  let body= _.pick(req.body,["email","password"]);
  let user= new User(body);
  user.save().then(()=>{
    return user.generateAuthToken();
  }).then((token)=>{
    res.header("x-auth",token).send(user);
  }).catch((e)=>{
    res.status(400).send(e);
  });

})

app.get("/users/me",authenticate,(req,res)=>{
  res.send(req.user);
})

app.post("/users/login",(req,res)=>{
  let body= _.pick(req.body,["email","password"]);

  User.findByCredentials(body.email,body.password).then(user=>{
    return user.generateAuthToken().then((token)=>{
      res.header("x-auth",token).send(user);
    })
  }).catch(err=>{
    res.status(400).send(err);
  })
});

app.delete("/users/me/token",authenticate,(req,res)=>{
  req.user.removeToken(req.token).then(()=>{
    res.status(200).send();
  },()=>{
    res.status(401).send();
  })
});

app.listen(port,()=>{
  console.log(`Started on port ${port}`);
})


module.exports={app};
