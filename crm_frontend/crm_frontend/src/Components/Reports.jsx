import { useEffect,useState,useMemo } from "react";
import api from "./api";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";

const COLORS=["#6366f1","#10b981","#f59e0b","#ef4444","#ec4899"];

const Reports=()=>{

  const [data,setData]=useState([]);

  useEffect(()=>{
    api.get("/interactions")
      .then(res=>setData(res.data));
  },[]);

  const {
    dateData,
    empData,
    funnelData,
    monthData,
    topCustomers
  } = useMemo(()=>{

    const byDate={};
    const empMap={};
    const monthMap={};
    const custMap={};

    const funnelMap={
      Lead:data.length,
      Interested:0,
      FollowUp:0,
      Closed:0
    };

    data.forEach(i=>{

     
      if(i.interactionDate){
        byDate[i.interactionDate]=(byDate[i.interactionDate]||0)+1;
      }

      const emp=i.callBy || "Unknown";
      empMap[emp]=(empMap[emp]||0)+1;

      const s=i.status || "";
      if(s.includes("Interested")) funnelMap.Interested++;
      if(s.includes("Follow")) funnelMap.FollowUp++;
      if(s.includes("Closed") || s.includes("Registration"))
        funnelMap.Closed++;

      if(i.interactionDate){
        const m=new Date(i.interactionDate)
          .toLocaleDateString("en-US",{month:"short"});
        monthMap[m]=(monthMap[m]||0)+1;
      }

      const c=i.customer?.customerName || "Unknown";
      custMap[c]=(custMap[c]||0)+1;

    });

    const dateData = Object.keys(byDate)
      .sort((a,b)=>new Date(a)-new Date(b))
      .map(d=>({date:d,count:byDate[d]}));

    const empData = Object.keys(empMap)
      .map(e=>({name:e,value:empMap[e]}));

    const funnelData = Object.keys(funnelMap)
      .map(k=>({stage:k,value:funnelMap[k]}));

    const monthOrder=[
      "Jan","Feb","Mar","Apr","May","Jun",
      "Jul","Aug","Sep","Oct","Nov","Dec"
    ];

    const monthData = Object.keys(monthMap)
      .sort((a,b)=>monthOrder.indexOf(a)-monthOrder.indexOf(b))
      .map(m=>({month:m,value:monthMap[m]}));

    const topCustomers = Object.keys(custMap)
      .map(c=>({name:c,value:custMap[c]}))
      .sort((a,b)=>b.value-a.value)
      .slice(0,5);

    return {
      dateData,
      empData,
      funnelData,
      monthData,
      topCustomers
    };

  },[data]);

  return(
    <div>

      <h4 className="fw-bold mb-4">📊 Advanced Analytics</h4>

      <div className="row">

        <div className="col-md-6">
          <div className="glass p-4 mb-4">
            <h6>Followups by Date</h6>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dateData}>
                <XAxis dataKey="date"/>
                <YAxis/>
                <Tooltip/>
                <Bar dataKey="count" fill="#6366f1"/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-md-6">
          <div className="glass p-4 mb-4">
            <h6>Employee Performance</h6>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={empData} dataKey="value" label>
                  {empData.map((_,i)=>(
                    <Cell key={i} fill={COLORS[i%COLORS.length]}/>
                  ))}
                </Pie>
                <Legend/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-md-6">
          <div className="glass p-4 mb-4">
            <h6>Conversion Funnel</h6>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={funnelData}>
                <XAxis dataKey="stage"/>
                <YAxis/>
                <Tooltip/>
                <Bar dataKey="value" fill="#10b981"/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-md-6">
          <div className="glass p-4 mb-4">
            <h6>Monthly Growth</h6>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthData}>
                <XAxis dataKey="month"/>
                <YAxis/>
                <Tooltip/>
                <Bar dataKey="value" fill="#f59e0b"/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-md-12">
          <div className="glass p-4 mb-4">
            <h6>Top Customers</h6>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={topCustomers} dataKey="value" label>
                  {topCustomers.map((_,i)=>(
                    <Cell key={i} fill={COLORS[i%COLORS.length]}/>
                  ))}
                </Pie>
                <Legend/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Reports;
