import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "./api";
import { toast } from "react-toastify";

const emptyContact = {
  name: "",
  phone: "",
  position: "",
  primaryContact: false
};

const EditCustomer = () => {

  const { id } = useParams();
  const navigate = useNavigate();

  const [loading,setLoading] = useState(true);
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
    contacts:[{...emptyContact,primaryContact:true}]
  });

  useEffect(()=>{

    api.get(`/customers/${id}`)
      .then(res=>{
        const data = res.data;

        setC({
          ...data,
          contacts:
            data.contacts?.length
              ? data.contacts
              : [{
                  name:data.contactName || "",
                  phone:data.contactNo || "",
                  position:data.position || "",
                  primaryContact:true
                }]
        });

        setLoading(false);
      })
      .catch(()=>{
        toast.error("Failed to load customer");
        navigate("/app/customers");
      });

  },[id,navigate]);



  const handleChange = e=>{
    setC(prev=>({
      ...prev,
      [e.target.name]:e.target.value
    }));
  };

  const handleContactChange = (i,field,value)=>{
    setC(prev=>{
      const list=[...prev.contacts];
      list[i]={...list[i],[field]:value};
      return {...prev,contacts:list};
    });
  };

  const addContact=()=>{
    setC(prev=>({
      ...prev,
      contacts:[...prev.contacts,{...emptyContact}]
    }));
  };

  const removeContact=(i)=>{
    if(c.contacts.length===1){
      toast.warning("At least one contact required");
      return;
    }

    const list=c.contacts.filter((_,idx)=>idx!==i);
    setC({...c,contacts:list});
  };

  const setPrimary=(i)=>{
    const list=c.contacts.map((ct,idx)=>({
      ...ct,
      primaryContact: idx===i
    }));

    setC({...c,contacts:list});
  };



  const fetchPincode = async(pin)=>{

    if(pin.length!==6) return;

    try{
      const res = await fetch(
        `https://api.postalpincode.in/pincode/${pin}`
      );

      const data = await res.json();

      if(data?.[0]?.Status==="Success"){

        const info=data[0].PostOffice[0];

        setC(prev=>({
          ...prev,
          state:info.State,
          district:info.District,
          taluka:info.Block || info.Region
        }));
      }

    }catch{
      console.log("Pincode lookup failed");
    }
  };



  const validate = ()=>{

    if(!c.customerName){
      toast.error("Customer name required");
      return false;
    }

    if(!c.contacts.some(x=>x.primaryContact)){
      toast.error("One contact must be primary");
      return false;
    }

    return true;
  };



 
  const update = ()=>{

    if(!validate()) return;

    setSaving(true);

    api.put(`/customers/${id}`,{
      ...c,
      branches: c.branches ? Number(c.branches) : 0
    })
    .then(()=>{
      toast.success("Customer updated!");

      window.dispatchEvent(
        new Event("followupUpdated")
      );

      setTimeout(()=>{
        navigate("/app/customers");
      },1200);
    })
    .catch(err=>{
      toast.error(
        err?.response?.data?.message || "Update failed"
      );
    })
    .finally(()=>{
      setSaving(false);
    });

  };



  if(loading){
    return(
      <div className="edit-wrap">
        <div className="elite-form-card">
          <h4>Loading...</h4>
        </div>
      </div>
    );
  }



  return(
    <div className="edit-wrap">

      <div className="elite-form-card" style={{maxWidth:"1000px"}}>

        <h4>✏️ Edit Customer</h4>
        <p className="sub">Update customer information</p>

        <div className="row g-4">

          <div className="col-md-6">

            <label>Customer Name</label>
            <input
              name="customerName"
              value={c.customerName}
              onChange={handleChange}
              className="elite-input"
            />

            <label>Priority</label>
            <select
              name="priority"
              value={c.priority}
              onChange={handleChange}
              className="elite-input"
            >
              <option value="">Select</option>
              <option value="High">🔴 High</option>
              <option value="Medium">🟡 Medium</option>
              <option value="Low">🟢 Low</option>
            </select>

            <label>Branches</label>
            <input
              type="number"
              name="branches"
              value={c.branches}
              onChange={handleChange}
              className="elite-input"
            />

            <label>Lead Date</label>
            <input
              type="date"
              name="leadGenerationDate"
              value={c.leadGenerationDate || ""}
              onChange={handleChange}
              className="elite-input"
            />

          </div>

          <div className="col-md-6">

            <label>Reference By</label>
            <input
              name="referenceBy"
              value={c.referenceBy}
              onChange={handleChange}
              className="elite-input"
            />

            <label>Pin Code</label>
            <input
              name="pinCode"
              value={c.pinCode}
              onChange={e=>{
                handleChange(e);
                fetchPincode(e.target.value);
              }}
              className="elite-input"
            />

            <label>State</label>
            <input name="state" value={c.state} onChange={handleChange} className="elite-input"/>

            <label>District</label>
            <input name="district" value={c.district} onChange={handleChange} className="elite-input"/>

            <label>Taluka</label>
            <input name="taluka" value={c.taluka} onChange={handleChange} className="elite-input"/>

          </div>
        </div>

        <label className="mt-3">Address</label>
        <textarea
          name="address"
          rows="3"
          value={c.address}
          onChange={handleChange}
          className="elite-input"
        />

        <hr className="my-4"/>
        <h5>Contacts</h5>

        {c.contacts.map((ct,i)=>(
          <div key={i} className="contact-card">

            <div className="contact-fields">

              <input
                placeholder="Name"
                value={ct.name}
                onChange={e=>handleContactChange(i,"name",e.target.value)}
                className="elite-input"
              />

              <input
                placeholder="Phone"
                value={ct.phone}
                onChange={e=>handleContactChange(i,"phone",e.target.value)}
                className="elite-input"
              />

              <input
                placeholder="Position"
                value={ct.position}
                onChange={e=>handleContactChange(i,"position",e.target.value)}
                className="elite-input"
              />

            </div>

            <div className="contact-actions">

              <button
                type="button"
                className={`primary-toggle ${ct.primaryContact?"active":""}`}
                onClick={()=>setPrimary(i)}
              >
                ⭐ Primary
              </button>

              {c.contacts.length>1 && (
                <button
                  type="button"
                  className="remove-btn"
                  onClick={()=>removeContact(i)}
                >
                  ✕
                </button>
              )}

            </div>

          </div>
        ))}

        <button onClick={addContact} className="add-contact-btn">
          + Add Contact
        </button>

        <div className="elite-form-actions">

          <button
            onClick={update}
            disabled={saving}
            className="elite-btn-primary"
          >
            {saving ? "Updating..." : "Update Customer"}
          </button>

          <button
            onClick={()=>navigate("/app/customers")}
            className="elite-btn-outline"
          >
            Cancel
          </button>

        </div>

      </div>
    </div>
  );
};

export default EditCustomer;
