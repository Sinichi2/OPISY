## Pan - Panziann Inventory System 
### *Created by Shiva Matthew Cruz on July 31, 2026* 
### *Updated by: Shiva Matthew Cruz*
### *Date: July 31st, 2026*
### *Version: 1.0.0*

**Note: Please update the "Updated by" and aspect and the Date for every update  

This serves as the overall documentation of Panzian's Inventory Management System. 

The Panzian Inventory Management System is powered by a Raspberry Pi 5, which stores the database via an SQLite, and 3 routers that span throughout the entirety of the resort. The routers does not pass any kind of internet, but the  

## Role Based Access Control (RBAC)

There are 3 roles within the app: 
1. Super admin
2. Owner
3. Staff 
4. Visitor

#### **Super admin**

The Super admin has access to the all of the pages and has visibility across all transactions for auditing purposes, especially when an error occurs. For the developer to have access to the super admin credentials, they should contact the Owner. The Owner holds the credentials of the super admin, unless it's the original developer himself, Shiva Matthew Cruz.

If any detail is missing, please contact **Shiva Matthew Cruz** immediately. You can reach out to me via the following: 

**Email:** Cruzshivajr@gmail.com
**Phone:** +63 952 458 5663 (Globe)

#### **Owner** 

The Owner role has access to all of the pages (aside from technical pages) and has the same level of visibility as the Super admin. Owner will have access to aspects such as analytics page, customizing menus, etc. The owner role is also a super admin per se, but with less technicality. 

The owner (& Staff) will be alerted to low stocks, can check stock count and waste tracking (with reason codes: Dropped, Expired, over-prepped) and different kinds of recipe integration to the menu that the staff can also see (especially, when they are the chef)

The owner can also classify what kind of staff there is, so RBAC is integrated to the add staff button, the add staff can create accounts with usernames and passwords. 

#### Staff

The staff role has 


#### Visitor 

Visitor role **only** has access to the restaurant menu and they can order meals of their choice based on what is available within the menu. 


#### Starting the project

To initialize the dependencies of the project, first do this: 

```
    bun install 
```

it will install the dependencies of the project. 