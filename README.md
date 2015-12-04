# cp-salesforce-service

## About
This is the Salesforce service, a repository which deals with the Salesforce integration of the [CoderDojo Zen Community Platform](https://github.com/CoderDojo/community-platform) project.

## Install:
For installation instructions, please see the [cp-local-development repository](https://github.com/CoderDojo/cp-local-development). 

General documentation is in the [community-platform repository](https://github.com/CoderDojo/community-platform).

## Configuration

Ensure configuration file for the running environment exists and has the correct options. Default environment is development, options read from `config/config.js` - environment overrides in `config/<environment>.env`.

### Environment variables

```
SALESFORCE_URL - url
SALESFORCE_USERNAME - username
SALESFORCE_PASSWORD - password
```

## Run

Start Server:

`./start.sh development ./service.js`

## Salesforce

SalesForce Leads are documented [here](https://www.salesforce.com/developer/docs/api/Content/sforce_api_objects_lead.htm). The full REST documentation may also be of use: http://www.salesforce.com/us/developer/docs/api_rest/api_rest.pdf.

## Testing
You'll need to be set up with an account on the CoderDojo Salesforce sandbox. Please get in touch with our Technical Lead for guidance!
