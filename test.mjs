const req = await fetch('http://localhost:8080/api/service/resources/example', {
  method: 'OPTIONS',
  credentials: 'include',
  body: JSON.stringify({})
});

console.log(req)