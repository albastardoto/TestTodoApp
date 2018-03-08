
const _=require("lodash");
const expect = require("expect");
const request = require("supertest");
const {ObjectId} = require("mongodb");
const {app} =require("./../server");
const {User} = require("./../models/user");
const {Todo}  = require("./../models/todo");
const {todos,populateTodos,users,populateUsers}= require("./seed/seed");

beforeEach(populateUsers);
beforeEach(populateTodos);

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

describe("GET /users/me",()=>{
  it("should return user if authenticated",(done)=>{
    request(app)
      .get("/users/me")
      .set("x-auth",users[0].tokens[0].token)
      .expect(200)
      .expect((res)=>{
        expect(res.body._id).toBe(users[0]._id.toHexString());
        expect(res.body.email).toBe(users[0].email);
      }).end(done);
  });
  it("should return 401 if not authenticated",(done)=>{
    request(app)
    .get("/users/me")
    .expect(401)
    .expect((res)=>{
      expect(res.body).toEqual({});
    }).end(done);
  });
});

describe("POST /users",()=>{
  let email = "example@example.com";
  it("should create a user",(done)=>{
    let password= "nasdjpasd";
    request(app)
    .post("/users")
    .send({email,password})
    .expect(200)
    .expect((res)=>{
      expect(res.headers['x-auth']).toBeDefined();
      expect(res.body._id).toBeDefined();
      expect(res.body.email).toBe(email);
    }).end((err)=>{
      if(err){
        return done(err);
      }
      User.findOne({email}).then((user)=>{
        expect(user).toBeDefined();
        expect(user.pasword).not.toBe(password);
        done();
      }).catch((e)=> done(e));
    });
  })
  it("should return validation errors",(done)=>{
    request(app)
    .post("/users")
    .send({email:"albert",password:"sup"})
    .expect(400)
    .end(done);
  });
  it("should not create user if email in use",(done)=>{
    request(app)
    .post("/users")
    .send({email:"alboop@gmail.com",password:"askdnpan"})
    .expect(400)
    .end(done);
  });
});

describe("POST /users/login",()=>{
  it("should login user and return auth token",(done)=>{
    request(app)
    .post("/users/login")
    .send({
      email: users[1].email,
      password: users[1].password
    })
    .expect(200)
    .expect((res)=>{
      expect(res.headers["x-auth"]).toBeDefined();
    })
    .end((err,res)=>{
      if(err)
        return done(err);
      User.findById(users[1]._id).then((user)=>{
        expect(user.toObject().tokens[0]).toMatchObject({
          access:"auth",
          token:res.headers["x-auth"]
        });
        done();
      }).catch((e)=> done(e));
    });
  });
  it("should reject invalid login",(done)=>{
    request(app)
    .post("/users/login")
    .send({
      email: users[1].email,
      password: users[1].password+"1"
    })
    .expect(400)
    .expect((res)=>{
      expect(res.headers["x-auth"]).not.toBeDefined();
    }).end((err,res)=>{
      if(err)
        return done(err);
      User.findById(users[1]._id).then((user)=>{
        expect(user.toObject().tokens.length).toBe(0);
        done();
      }).catch((e)=> done(e));
    });
  });
});

describe("DELETE /users/me/token",()=>{
  it("should remove auth token on log-out",(done)=>{
    request(app)
    .delete("/users/me/token")
    .set("x-auth",users[0].tokens[0].token)
    .end((err,res)=>{
      User.findById(users[0]._id).then((user)=>{
        expect(user.toObject().tokens.length).toBe(0);
        done();
      }).catch((e)=>done(e));
    });
  });
});
