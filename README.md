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

####Adding instruments

In order to add new instruments, two important files are needed, the **.form** and the **.label** files. The combination
of these two files describes the form, structure and content. I will take the example of the EAW.

**EAW.form**

This file describes what are the entry fields of the form (text fields, date fields, nummeric fields, drop down fields, etc.), these fields are given a unique name which is referred to in the label-file. In this file also the order of fields is
determined and whether or not they represent mandatory information. Also tabs can be defined, enabling us the spread the
fields over substantially connected fields. 

Also dependency information is added in this file, for example some fields should only be available based on the selection 
of other fields. Other information in this file include the need for translations (does the content of the field need to 
be translated for the actual request?), should it be included in the final request.

Also the layout of the coverpage is described in this file. The result is a rather complicated .json file, that gives
great flexibility in the laying out of the form, at the expense of high complexity.

**EAW.label**

Most fields that are included in the **EAW.form** file have been given names that are referred to from the **EAW.label** file. For each named field it is possible to add the associated labels in the EU languages. 

####Managing the labels

Once the forms (.form and .label) files have been defined, the labels can be managed through a simple tool found in file **manage.html**. In this file the administrator chooses an Instrument and is presented with all the labels of that form.
From there it is possible to add translations or edit current content. By changing the shown labels (or Show all) and disabling/enabling labels (or Enable all), it is made easy to limit the shown content and to prevent accidental copy-and-paste into wrong languages. 


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
**.label**, **.form** : files describing the form (see above)



