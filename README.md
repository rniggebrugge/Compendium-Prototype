# Compendium-Prototype

Author  : Remco Niggebrugge
Purpose : Creating a limited but functioning prototype of a Compendium Tool

####Description

The Compendium Prototype shows how such a tool could function. By splitting instrument, form, fields and labels it allows the 
quick generation of new forms in new languages, without having to alter the machine that renders these forms. In order to
achieve this files describing a form (its layout/structure) are separated from files populating this structure with actual labels.
Thus structure and content files are created for each instrument (=form), these follow the JSON format to ensure a smooth
communication between the rendering machine data.

####Storage

Temporary or draft versions, and also the ultimate versions of a request, are stored in "Local Storage". This is done so that
all content added by a practitioner is easily accessible when he/she starts a new session and wants to retrieve previous work.
In principle the draft versions can also be saved as an xml/json/other file, this has the advantage that it can easily be shared
with other persons (by file sharing) and between browsers (local storage is limited to browser). Either way, file storage or
local storage, are acceptable, as long as no data is sent over the internet, any storage solution is ok.

It is possible to export/import from and to local storage using the filesystem.

####Generating request

Once the practitioner is done filling in the form, the actual request can be drafted. The PDF file is created using Javascript
functionality, in other words: the browser does not depend on an external server to generate the form. This ensures that
the confidential information never leaves the client computer.

####Files

A short description of the files used in this project. Being a prototype, not everything is fully worked out.

**index.html** : default file, from here all other files are loaded. This is the access point to the Prototype.   
**legal-stules.css** : stylesheet for the Prototype  
**FileSaver.js** : used to handle files saved directly into filesystem  
**Blob.js** : used to handle files saved directly into filesystem  
**../jsPDF/....js** : a collection of Javascript files needed to generate PDF documents from the browser  
**legal-scripts.js** : Javascript file adding the functionality to the Prototype (loading/saving data and forms, etc.)  
**.htaccess**  : only used to avoid browsers caching files containing the form-details. This ensures that any changes to 
these files are immediately visible.  




