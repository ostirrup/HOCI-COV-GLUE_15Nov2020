#!/bin/bash

# An administrator, who knows the mysql root password, can run this script 
# It will set up the GLUE database for a specific user. Following this, the
# user themselves logs into the machine and runs the initGlue.sh script from their home dir

# Usage is:
# ./initGlueUser.sh -u <climbUsername> -r <mysqlRootPassword> -p <glueDbPassword>

# The climbUserName would be e.g. climb-covid19-singerj
# The glueDbPassword is a password that you specify, you must then communicate this to the user so that they can 
# supply it to the initGlue.sh script.

while getopts "u:r:p:" opt; do
case ${opt} in
u )
export CLIMB_USERNAME=${OPTARG}
;;
r )
export MYSQL_ROOT_PW=${OPTARG}
;;
p )
export GLUE_DB_PW=${OPTARG}
;;
\? )
# option error
exit 1
;;
: )
# argument error
exit 1
;;
esac
done

if [ -z "$CLIMB_USERNAME" ]
then
      echo "Please supply the CLIMB username using -u <climbUsername>"
      exit 1
fi

if [ -z "$MYSQL_ROOT_PW" ]
then
      echo "Please supply the mysql root password using -r <mysqlRootPassword>"
      exit 1
fi

if [ -z "$GLUE_DB_PW" ]
then
      echo "Please supply a new, secure gluetools database password for the user using -p <glueDbPassword>"
      exit 1
fi


if [ "${HOSTNAME}" == "cardff-glue.novalocal" ]
then
	export GLUETOOLS_USER=${CLIMB_USERNAME//climb-covid19-/}_gt
	export GLUETOOLS_DB=${CLIMB_USERNAME//climb-covid19-/}_gdb
	MYSQL_ROOT_USER=root
else
    echo "unknown server $HOSTNAME"
    exit 1 
fi

echo "Deleting old DB user $GLUETOOLS_USER ..."
echo "drop user '$GLUETOOLS_USER'@'localhost';" | mysql --user=${MYSQL_ROOT_USER} --password=${MYSQL_ROOT_PW} 2> /dev/null
echo "Creating new DB user $GLUETOOLS_USER ..."
echo "create user '$GLUETOOLS_USER'@'localhost' identified by '$GLUE_DB_PW';" | mysql --user=${MYSQL_ROOT_USER} --password=${MYSQL_ROOT_PW}

echo "Deleting old GLUE database $GLUETOOLS_DB ..."
echo "drop database $GLUETOOLS_DB;" | mysql --user=${MYSQL_ROOT_USER} --password=${MYSQL_ROOT_PW} 2> /dev/null
echo "Creating new GLUE database $GLUETOOLS_DB ..."
echo "create database $GLUETOOLS_DB character set UTF8;" | mysql --user=${MYSQL_ROOT_USER} --password=${MYSQL_ROOT_PW}

echo "Granting privileges to $GLUETOOLS_USER on database $GLUETOOLS_DB ..."
echo "grant all privileges on $GLUETOOLS_DB.* to '$GLUETOOLS_USER'@'localhost'" | mysql --user=${MYSQL_ROOT_USER} --password=${MYSQL_ROOT_PW}

echo "GLUE user initialisation complete"
echo "Now contact the user, inform them of their password, and request that they run initGlue.sh"