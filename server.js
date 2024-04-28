const express=require('express');
const app=express();
require('dotenv').config();
const sf=require('jsforce');

app.use(express.static('frontend'))
app.use(express.json())

var conn=new sf.Connection({
    loginUrl:process.env.SF_LOGIN_URL
})

const triggerBody=`trigger myTrigger on Contact (after insert, before delete) {
    if (Trigger.isAfter && Trigger.isInsert) {
        List<Case> CaseList = new List<Case>();
        for (Contact contactItem: Trigger.New) {
            // New case
            Case CaseRecord = new Case();             
            CaseRecord.ContactId = contactItem.Id;
            CaseRecord.AccountId = contactItem.AccountId;
            CaseRecord.Status = 'Working';
            CaseRecord.Origin = 'New Contact';
            
            // Set Owner field
            List<Account> AccountRecord = [SELECT OwnerId FROM Account WHERE Id = :contactItem.AccountId LIMIT 1];
            if (AccountRecord.size() > 0) {
                CaseRecord.OwnerId = AccountRecord[0].OwnerId;
            }

            switch on contactItem.Contact_Level__c {
    			when 'Primary' {		
        			CaseRecord.Priority = 'High';
    			}	
    			when 'Secondary' {	
       				CaseRecord.Priority = 'Medium';
    			}
    			when 'Tertiary' {
       				CaseRecord.Priority = 'Low';
    			}
                // When else, then by default, as in the Сase
			}            
            CaseList.add(CaseRecord);            
        }
        
		// If list is empty then nothing insert.
    	if (CaseList.size() > 0) {
    		try{
    	  	  insert CaseList;
    		} catch (DmlException e){
    			for (Integer i = 0; i < e.getNumDml(); i++) {
        			// Process exception here
        			System.debug('$$$ ' + e.getDmlMessage(i));
   				}
    		}
   		}
    }
    if(Trigger.isDelete) {
        List<Case> CaseList = new List<Case>();
        for (Contact contactItem: Trigger.Old) {            
            // Set list records for delete
            List<Case> CaseRecords = [SELECT Id FROM Case WHERE ContactId = :contactItem.Id];
            CaseList.addAll(CaseRecords);
        }
    	if (CaseList.size() > 0) {
    		try{
    	  	  delete CaseList;
    		} catch (DmlException e) {
    			for (Integer i = 0; i < e.getNumDml(); i++) {
        			// Process exception here
        			System.debug('$$$ ' + e.getDmlMessage(i)); 
   				}
    		}
   		}
	}
    }`

let user;
conn.login(process.env.SF_USER, process.env.SF_PASSWORD+process.env.SF_SECRET_TOKEN,(err, userInfo)=>{
    if(err){
        console.log(err);
    }
    user=userInfo.id;
    console.log("User Info: "+JSON.stringify(userInfo));
})

/*conn.tooling.sobject('ApexTrigger').find({
    Name: 'myTrigger'
}).execute(function(err, records) {
    if (err) { return console.error(err); }
    if(records.length<=0){
        conn.tooling.sobject('ApexTrigger').create({
            Name: 'myTrigger',
            Body: triggerBody,
            TableEnumOrId: 'Contact'
          }, (err, res) => {
            if (err) {
              console.error('Error trigger:', err);
            } else {
              console.log('Trigger created:', res.id);
            }
          });
    }
});*/

var accounts=[];

app.get("/",(req,res)=>{
    res.sendFile(__dirname+"/frontend/salesforcePage.html");
});
app.get("/contacts",async (req,res)=>{
    var records=[];
    let q;
    q='select Id, Name, Email, Contact_Level__c, AccountId, OwnerId, CreatedById, Date__c from Contact';
    await conn.query(q)
    .on('record',(record)=>{
        records.push(record);
    });
    console.log('Data:'+records.length);
    res.status(200).json(records);
})



app.post("/new-contact",async(req, res)=>{
    const data=req.body;
    console.log(data);
    conn.sobject('Contact').create({
        FirstName: data.firstName, 
        LastName: data.lastName, 
        Email: data.email, 
        Contact_Level__c: data.ContactLevel,
        AccountId: data.accountId,
        OwnerId: user,
        Date__c: new Date().toISOString().slice(0,10)
    },function(err, ret) {
        if (err || !ret.success) {
             console.error(err, ret); 
             res.send({msg: err});
        }
        else{
            console.log("Created record id : " + ret.id);
            res.send(accounts)
        }
    });
})

app.get("/accounts",async(req,res)=>{
    await conn.query("select Id, Name from Account").on('record',(record)=>{
        accounts.push(record);
    })
    res.status(200).json(accounts);
})

app.delete('/delete-contact/:id',async(req,res)=>{
    try{
        conn.sobject('Contact').destroy(req.params.id, function(err, ret) {
            if (err || !ret.success) {
                 console.error(err, ret); 
                 res.send({msg : err + ret})
            }
            else{
              console.log('Deleted Successfully : ' + ret.id);
              res.send(accounts)
            }
        });
    }
    catch(e){
        console.log('Error: '+e);
    }
})

app.listen(8085)

module.exports=app