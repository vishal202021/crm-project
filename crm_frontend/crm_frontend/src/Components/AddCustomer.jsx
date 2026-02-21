import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";
import { toast } from "react-toastify";

const emptyContact = {
  name: "",
  phone: "",
  position: "",
  primaryContact: false
};

const AddCustomer = () => {

  const navigate = useNavigate();
  const [saving,setSaving] = useState(false);

  const [c,setC] = useState({
    customerName:"",
    priority:"",
    branches:"",
    leadGenerationDate:"",
    address:"",
    pinCode:"",
    referenceBy:"",
    state:"",
    district:"",
    taluka:"",
    contacts:[{...emptyContact, primaryContact:true}]
  });

  const handleChange = e =>
    setC({...c,[e.target.name]:e.target.value});

  const handleContactChange = (i,field,value)=>{
    const list = [...c.contacts];
    list[i][field] = value;
    setC({...c,contacts:list});
  };

  const addContact = ()=>{
    setC({...c,contacts:[...c.contacts,{...emptyContact}]});
  };

  const removeContact = (i)=>{
    if(c.contacts.length===1) return;
    const list = c.contacts.filter((_,idx)=>idx!==i);
    setC({...c,contacts:list});
  };

  const setPrimary = (i)=>{
    const list = c.contacts.map((ct,idx)=>({
      ...ct,
      primaryContact: idx===i
    }));
    setC({...c,contacts:list});
  };

 
  const fetchPincode = async (pin)=>{
    if(pin.length!==6) return;

    try{
      const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      const data = await res.json();

      if(data[0].Status==="Success"){
        const info = data[0].PostOffice[0];

        setC(prev=>({
          ...prev,
          state:info.State,
          district:info.District,
          taluka:info.Block || info.Region
        }));
      }
    }catch{}
  };

  
  const validate = ()=>{

    if(!c.customerName.trim()){
      toast.error("Customer name required");
      return false;
    }

    if(!c.priority){
      toast.error("Select priority");
      return false;
    }

    if(c.pinCode && c.pinCode.length!==6){
      toast.error("Invalid pincode");
      return false;
    }

    if (c.leadGenerationDate) {
  const selected = new Date(c.leadGenerationDate);
  const today = new Date();
  today.setHours(0,0,0,0);

  if(selected > today){
    toast.error("Lead date cannot be future");
    return false;
  }
}

   const primaryCount =
  c.contacts.filter(ct=>ct.primaryContact).length;

if(primaryCount !== 1){
  toast.error("Exactly ONE primary contact required");
  return false;
}

    for(const ct of c.contacts){
      if(!ct.name.trim()){
        toast.error("Contact name required");
        return false;
      }
      if(!/^\d{10}$/.test(ct.phone)){
        toast.error("Invalid phone number");
        return false;
      }
    }

    return true;
  };


  const save = async ()=>{

    if(!validate()) return;

    try{
      setSaving(true);
    //  console.log("PAYLOAD:", JSON.stringify(c, null, 2));
      await api.post("/customers",{
        ...c,
        customerName:c.customerName.trim(),
        branches:Number(c.branches)
      });

      toast.success(`🎉 ${c.customerName} added!`);

      setTimeout(()=>navigate("/app/customers"),1200);

    }catch(err){

      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Error saving customer";

      toast.error(msg);

    }finally{
      setSaving(false);
    }
  };

  return(
    <div className="edit-wrap">
      <div className="elite-form-card" style={{maxWidth:"950px"}}>

        <h4>Add Customer</h4>
        <p className="sub">Create a new customer profile</p>

        <div className="row g-4">

          <div className="col-md-6">

            <label>Customer Name *</label>
            <input name="customerName" className="elite-input" onChange={handleChange}/>

            <label>Priority *</label>
            <select name="priority" className="elite-input" onChange={handleChange}>
              <option value="">Select</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>

            <label>Branches</label>
            <input type="number" name="branches" className="elite-input" onChange={handleChange}/>

            <label>Lead Date</label>
            <input type="date" name="leadGenerationDate" className="elite-input" onChange={handleChange}/>

            <label>Reference By</label>
            <input name="referenceBy" className="elite-input" onChange={handleChange}/>

            <label>Address</label>
            <textarea name="address" rows="3" className="elite-input" onChange={handleChange}/>

          </div>

          <div className="col-md-6">

            <label>Pin Code</label>
            <input
              name="pinCode"
              className="elite-input"
              onChange={e=>{
                handleChange(e);
                fetchPincode(e.target.value);
              }}
            />

            <label>State</label>
            <input name="state" value={c.state} className="elite-input" onChange={handleChange}/>

            <label>District</label>
            <input name="district" value={c.district} className="elite-input" onChange={handleChange}/>

            <label>Taluka</label>
            <input name="taluka" value={c.taluka} className="elite-input" onChange={handleChange}/>

          </div>
        </div>

        <hr className="my-4"/>

        <h5>Contacts *</h5>

        {c.contacts.map((ct,i)=>(
          <div key={i} className={`contact-card ${ct.primaryContact?"primary":""}`}>

            <div className="contact-fields">
              <input placeholder="Name" className="elite-input"
                value={ct.name}
                onChange={e=>handleContactChange(i,"name",e.target.value)}/>

              <input placeholder="Phone" className="elite-input"
                value={ct.phone}
                onChange={e=>handleContactChange(i,"phone",e.target.value)}/>

              <input placeholder="Position" className="elite-input"
                value={ct.position}
                onChange={e=>handleContactChange(i,"position",e.target.value)}/>
            </div>

            <div className="contact-actions">
              <button type="button"
                className={`primary-toggle ${ct.primaryContact?"active":""}`}
                onClick={()=>setPrimary(i)}>
                ⭐ Primary
              </button>

              {c.contacts.length>1 &&
                <button type="button"
                  className="remove-btn"
                  onClick={()=>removeContact(i)}>
                  ✕
                </button>}
            </div>

          </div>
        ))}

        <button type="button" className="add-contact-btn" onClick={addContact}>
          + Add Another Contact
        </button>

        <div className="elite-form-actions mt-3">

          <button
            onClick={save}
            disabled={saving}
            className="elite-btn-primary">
            {saving ? "Saving..." : "Save Customer"}
          </button>

          <button
            onClick={()=>navigate("/app/customers")}
            className="elite-btn-outline">
            Cancel
          </button>

        </div>

      </div>
    </div>
  );
};

export default AddCustomer;
