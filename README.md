# salesforce service

## Install:

```
npm install
```

## Configuration

Ensure configuration file for the running environment exists and has the correct options. Default environment is development, options read from `config/config.js` - environment overrides in `config/<environment>.env`.

## Run

Start Server:

`./start.sh ./service.js development`

## Salesforce

SalesForce Leads are documented [here](https://www.salesforce.com/developer/docs/api/Content/sforce_api_objects_lead.htm). The full REST documentation may also be of use: http://www.salesforce.com/us/developer/docs/api_rest/api_rest.pdf.

## Custom Fields

It is necessary to create two custom fields on Leads in SalesForce:

* In SalesForce, go to Setup -> Build -> Customize -> Leads -> Fields
* Create a 'Platform Id' field of type string, set the field name to 'PlatformId'
* Create a 'Platform Url' field of type URL, set the field name to 'PlatformUrl'
