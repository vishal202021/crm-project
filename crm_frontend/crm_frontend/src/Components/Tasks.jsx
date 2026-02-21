import { useState, useEffect, useMemo } from "react";

const Tasks = () => {

  const [tasks,setTasks]=useState([]);
  const [text,setText]=useState("");


  useEffect(()=>{
    const saved=localStorage.getItem("tasks");
    if(saved){
      try{
        setTasks(JSON.parse(saved));
      }catch{
        setTasks([]);
      }
    }
  },[]);

 
  useEffect(()=>{
    localStorage.setItem("tasks",JSON.stringify(tasks));
  },[tasks]);


  const sortedTasks = useMemo(()=>{
    return [...tasks].sort((a,b)=>{
      if(a.done===b.done) return b.id-a.id;
      return a.done ? 1 : -1;
    });
  },[tasks]);


  const addTask=()=>{

    const trimmed=text.trim();
    if(!trimmed) return;

    const newTask={
      id:Date.now(),
      text:trimmed,
      done:false
    };

  
    setTasks(prev=>[newTask,...prev]);
    setText("");
  };

  const toggle=id=>{
    setTasks(prev =>
      prev.map(t =>
        t.id===id ? {...t,done:!t.done} : t
      )
    );
  };

  const remove=id=>{
    setTasks(prev =>
      prev.filter(t=>t.id!==id)
    );
  };

 

  return(
    <div className="page-wrap">

      <div className="ds-card mb-4 d-flex justify-content-between">
        <h4 className="fw-bold m-0">📝 Tasks</h4>
      </div>

   
      <div className="ds-card mb-3 d-flex gap-2">

        <input
          className="elite-input"
          placeholder="Add new task..."
          value={text}
          onChange={e=>setText(e.target.value)}
          onKeyDown={e=>{
            if(e.key==="Enter") addTask();
          }}
        />

        <button
          onClick={addTask}
          className="elite-btn-primary"
        >
          Add
        </button>

      </div>

  
      <div className="ds-card">

        {sortedTasks.length===0 && (
          <p className="text-muted text-center">
            No tasks yet 🚀
          </p>
        )}

        {sortedTasks.map(t=>(
          <div
            key={t.id}
            className="ds-task-item d-flex justify-content-between align-items-center mb-2"
          >

            <div
              onClick={()=>toggle(t.id)}
              style={{
                cursor:"pointer",
                textDecoration:t.done?"line-through":"none",
                opacity:t.done?0.5:1,
                transition:"0.2s"
              }}
            >
              {t.done ? "✅" : "⬜"} {t.text}
            </div>

            <button
              onClick={()=>remove(t.id)}
              className="ds-task-delete"
            >
              ✕
            </button>

          </div>
        ))}

      </div>

    </div>
  );
};

export default Tasks;
