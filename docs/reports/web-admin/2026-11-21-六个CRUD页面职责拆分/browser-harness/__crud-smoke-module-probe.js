const failures=[]
const onResponse=async response=>{if(response.status()>=400&&response.url().startsWith('http://127.0.0.1:5187/'))failures.push({url:response.url(),status:response.status(),body:(await response.text().catch(()=>'' )).slice(0,4000)})}
page.on('response',onResponse)
await page.reload()
await page.waitForFunction(()=>!!window.smoke)
const result=await page.evaluate(async()=>{try{await window.smoke.mount('user-editor');return {loaded:true,body:document.body.innerText}}catch(error){return {loaded:false,error:String(error)}}})
await page.waitForTimeout(500)
page.off('response',onResponse)
console.log(JSON.stringify({result,failures,errors},null,2))
