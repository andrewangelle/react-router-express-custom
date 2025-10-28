const req = await fetch('http://localhost:8080/api/service/resources/example', {
  credentials: 'include'
});

console.log(req)