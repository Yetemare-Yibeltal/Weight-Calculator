
const massInput= document.querySelector('#mass')
const gravityInput= document.querySelector('#gravity')  
const button = document.querySelector('button')  
const result =document.querySelector('p')

button.addEventListener('click',()=>{
  let mass= Number(massInput.value);
  let gravity=Number(gravityInput.value);
  const weight = Math.round(mass * gravity);
  
  result.textContent=`the weight of an object is ${weight} kilogram per second square .`
});
 