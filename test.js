console.log("Testando criação de curso via JavaScript..."); 
fetch("http://localhost:3000/api/courses", {
  method: "POST", 
  headers: {"Content-Type": "application/json"}, 
  body: JSON.stringify({
    name: "Teste JavaScript", 
    martialArt: "Krav Maga", 
    level: "BEGINNER"
  })
}).then(r => r.json()).then(console.log).catch(console.error);
