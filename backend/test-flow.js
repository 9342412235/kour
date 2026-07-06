async function verify() {
  console.log("Starting verification...");

  let API = 'http://localhost:4000/api';
  
  try {
    let res = await fetch(`${API}/orders/tax-rate`);
    if(res.ok) console.log("Backend is accessible.");
    else console.log("Backend responded with:", res.status);
  } catch (err) {
    console.error("Backend not accessible:", err.message);
  }
}

verify();
