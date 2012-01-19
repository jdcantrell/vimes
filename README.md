#Vimes

This is a dumb program that lets you create lists that have a nice font
and a reasonably cool selectable background.

#Installation

Vimes has the following requirements:
* Apache/WSGI Web server
* Python
* Flask
* mysql-alchemy

The database can be initialized by setting the correct values in the
config.py file and then in a python shell:
 import vimes
 init_db()


#To Do
* Use flask-login instead my own/flask-openid thing
* Use flask-sqlalchemy instead my own thing
* Implement the list index page
* Add in saving status messages
* Make saving work
* Test with SINGLE_USER = false
* ol or ul
* and more!

