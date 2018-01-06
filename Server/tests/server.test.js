
const _=require("lodash");
const expect = require("expect");
const request = require("supertest");
const {ObjectId} = require("mongodb");
const {app} =require("./../server");
const {Todo}  = require("./../models/todo");

const todos=[{
  _id:new ObjectId(),
  text:"first td",
  completed:false
},{
  _id:new ObjectId(),
  text:"second td",
  completed:true,
  completedAt:1245324635
}]

beforeEach((done)=>{
  Todo.remove({}).then(()=> {
    return Todo.insertMany(todos);
  }).then(()=>done());
});

describe("POST /todos",()=>{
  it("should create a new todo",(done)=>{
    let text = "Test todo text";

    request(app)
    .post("/todos")
    .send({text})
    .expect(200)
    .expect((res)=>{
      expect(res.body.text).toBe(text);
    })
    .end((err,res)=>{
      if(err){
        return done(err);
      }
      Todo.find({text}).then((todos)=>{
        expect(todos.length).toBe(1);
        expect(todos[0].text).toBe(text);
        done();
      }).catch(e=>done(e));
    });
  });

  it("Should not create a Todo with invalid Data",(done)=>{
    request(app)
    .post("/todos")
    .send({})
    .expect(400)
    .end((err,res)=>{
      if(err){
        return done(err)
      }
      Todo.find().then((todos)=>{
        expect(todos.length).toBe(2);
        done();
      }).catch(e=>done(e));
    });
  });
});

describe("GET /todos",()=>{
  it("Should get all todos",(done)=>{
    request(app)
    .get("/todos")
    .expect(200)
    .expect((res)=>{
      expect(res.body.todos.length).toBe(2);
    }).end(done);
  });
});

describe("GET /todos/:id",()=>{
  it("Should return todo doc",(done)=>{
    request(app)
    .get(`/todos/${todos[0]._id.toHexString()}`)
    .expect(200)
    .expect((res)=>{
      expect(res.body.todo.text).toBe(todos[0].text);
    })
    .end(done);
  });
  it("Should return 404 if todo not found",(done)=>{
    request(app)
    .get(`/todos/${new ObjectId()}`)
    .expect(404)
    .end(done);
  });
  it("Should return 404 for non-object ids",(done)=>{
    request(app)
    .get('/todos/invalidid')
    .expect(404)
    .end(done);
  });
});

describe("DELETE /todos/:id",()=>{
  it("Should remove a todo",(done)=>{
    request(app)
    .delete(`/todos/${todos[0]._id.toHexString()}`)
    .expect(200)
    .expect((res)=>{
      expect(res.body.todo.text).toBe(todos[0].text);
    }).end((err,res)=>{
      if(err){
        return done(err);
      }
      Todo.findById(todos[0]._id.toHexString()).then((todo)=>{
        expect(todo).toBeNull();
        done();
      }).catch((e)=>done(e));
    });
  });
  it("Should return 404 if todo not found",(done)=>{
    request(app)
    .delete(`/todos/${new ObjectId().toHexString()}`)
    .expect(404)
    .end(done);
  });
  it("Should return 404 if objectId is invalid",(done)=>{
    request(app)
    .delete(`/todos/123ais!`)
    .expect(404)
    .end(done);
  })
});

describe("PATCH /todos/:id",()=>{
  it("Should update todo",(done)=>{
    let id = todos[0]._id.toHexString();
    request(app)
    .patch("/todos/"+id)
    .send({completed:true, text:"updated text"})
    .expect(200)
    .expect((res)=>{
      expect(res.body.todo.text).toBe("updated text");
      expect(res.body.todo.completed).toBe(true);
      expect(typeof res.body.todo.completedAt).toBe("number");
    }).end(done);
  });
  it("Should clear completedAt when completed set to false",(done)=>{
    let id = todos[1]._id.toHexString();
    request(app)
    .patch("/todos/"+id)
    .send({completed:false})
    .expect(200)
    .expect((res)=>{
      expect(res.body.todo.completed).toBe(false);
      expect(res.body.todo.completedAt).toBeNull();
    }).end(done);
  });
});
