

module.exports=function(app){
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

}
