export const cities = [
  'Mumbai','Pune','Ahmedabad','Surat','Vadodara','Delhi','Jaipur','Udaipur','Indore','Bhopal',
  'Nagpur','Hyderabad','Bengaluru','Chennai','Kolkata','Lucknow','Prayagraj','Varanasi','Agra','Goa'
].map((name,i)=>({id:`C${i+1}`,name,state:['Maharashtra','Maharashtra','Gujarat','Gujarat','Gujarat','Delhi','Rajasthan','Rajasthan','Madhya Pradesh','Madhya Pradesh','Maharashtra','Telangana','Karnataka','Tamil Nadu','West Bengal','Uttar Pradesh','Uttar Pradesh','Uttar Pradesh','Uttar Pradesh','Goa'][i]}));

const pairs = [
 ['Mumbai','Pune', 'Train',3.2,420],['Mumbai','Surat','Train',3.5,500],['Mumbai','Goa','Train',10,850],
 ['Pune','Ahmedabad','Bus',9,900],['Pune','Hyderabad','Flight',1.5,2800],['Surat','Vadodara','Bus',2.1,240],
 ['Surat','Ahmedabad','Train',3,300],['Vadodara','Ahmedabad','Train',1.5,180],['Ahmedabad','Udaipur','Bus',5,550],
 ['Ahmedabad','Jaipur','Train',9,750],['Jaipur','Delhi','Train',4.5,500],['Udaipur','Indore','Bus',7,700],
 ['Indore','Bhopal','Train',3.5,280],['Bhopal','Nagpur','Train',5,420],['Nagpur','Hyderabad','Train',8,650],
 ['Hyderabad','Bengaluru','Bus',9,800],['Bengaluru','Chennai','Train',6,450],['Chennai','Kolkata','Flight',2.5,3600],
 ['Delhi','Agra','Train',2,250],['Agra','Lucknow','Bus',5,450],['Lucknow','Prayagraj','Train',3,220],
 ['Prayagraj','Varanasi','Train',2.5,200],['Varanasi','Kolkata','Train',10,750],['Delhi','Lucknow','Flight',1.3,2600],
 ['Delhi','Prayagraj','Train',8,650],['Mumbai','Ahmedabad','Flight',1.2,2200],['Pune','Goa','Bus',10,750],
 ['Goa','Bengaluru','Flight',1.4,2400],['Bhopal','Jaipur','Bus',8,750],['Nagpur','Bhopal','Bus',5,450],
 ['Mumbai','Pune','Bus',4,320],['Mumbai','Pune','Flight',1.1,2800],
 ['Mumbai','Delhi','Flight',2.2,4500],['Mumbai','Delhi','Train',16,1450],
 ['Delhi','Kolkata','Flight',2.3,5200],['Delhi','Varanasi','Flight',1.4,3200],
 ['Delhi','Varanasi','Train',11,780],['Mumbai','Hyderabad','Flight',1.5,3400],
 ['Hyderabad','Kolkata','Flight',2,4100],['Mumbai','Bengaluru','Flight',1.6,3600],
 ['Bengaluru','Kolkata','Flight',2.5,4700],['Lucknow','Varanasi','Train',5,380],
 ['Bhopal','Delhi','Train',8,690],['Nagpur','Kolkata','Train',15,980]
];
function clock(h) { const m=Math.round((h%1)*60); return `${String(Math.floor(h)%24).padStart(2,'0')}:${String(m).padStart(2,'0')}`; }
export const transport = pairs.flatMap((p,i)=>{
  const [a,b,mode,duration,fare]=p;
  const variants=[0,1].map(v=>{
    const dep=6+(i*3+v*5)%14;
    const start=new Date(`2026-01-01T${clock(dep)}:00`);
    const end=new Date(start.getTime()+duration*3600000);
    return {id:`T${i+1}-${v+1}`,from:a,to:b,mode,service:`${mode==='Train'?'RR Express':mode==='Bus'?'RouteLine':'SkyHop'} ${410+i*3+v}`,
      departure:clock(dep),arrival:clock(dep+duration),durationHours:duration,distanceKm:Math.round(duration*(mode==='Flight'?600:mode==='Train'?65:48)),
      farePerPerson:fare+v*90,available:true,days:['Daily']};
  });
  return [...variants,...variants.map(x=>({...x,id:`${x.id}-R`,from:b,to:a,departure:clock((parseInt(x.departure.slice(0,2))+12)%24),arrival:clock((parseInt(x.arrival.slice(0,2))+12)%24)}))];
});
export const hotels = cities.flatMap((c,i)=>[1,2,3].map((n)=>({
 id:`H${i+1}-${n}`,name:['City Comfort Inn','Urban Stay Hotel','Grand Stay Residency'][n-1],city:c.name,
 pricePerNight:850+n*450+(i%4)*100,rating:3.5+n*.4,type:['Budget','Standard','Premium'][n-1],
 facilities:['Wi-Fi','24-hour reception','Air conditioning'],description:`Comfortable ${['budget','well-equipped','premium'][n-1]} stay near ${c.name} transport links.`,available:true
})));
