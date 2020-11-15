#!/bin/bash

# this script assumes that initGlueUser.sh has been run by a trusted admin of CLIMB-GLUE
# To use this script, the user should log in on climb-glue
# cd to the their home directory
# run this script 
# it will do everything to prepare the user for using GLUE.


# get number of glue threads as an option argument.
while getopts "t:p:" opt; do
case ${opt} in
t )
echo "setting GLUE_THREADS to user-defined value ${OPTARG}"
export GLUE_THREADS=${OPTARG}
;;
p )
export GLUETOOLS_PASSWORD=${OPTARG}
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

if [ -z "$GLUETOOLS_PASSWORD" ]
then
      echo "Please supply your gluetools database password (provided by the administrator) using -p <password>"
      exit 1
fi

if [ "${HOSTNAME}" == "cardff-glue.novalocal" ]
then
	export GLUETOOLS_USER=${USER//climb-covid19-/}_gt
	export GLUETOOLS_DB=${USER//climb-covid19-/}_gdb
	GLUETOOLS_REPO=/home/centos/gitrepos/gluetools
	GLUETOOLS_JAR_DIRECTORY=/opt/gluetools/lib
	GLUETUTORIAL_REPO=/home/centos/gitrepos/GLUE-tutorial
	if [[ -z "$GLUE_THREADS" ]]; then
      echo "setting GLUE_THREADS to default for server climb-glue: 8"
      echo "use -t <threads> to define an alternative value"
      export GLUE_THREADS=8
    fi
else
    echo "unknown server $HOSTNAME"
    exit 1 
fi

echo "Building GLUE installation"
mkdir -p ~/gluetools
mkdir -p ~/gluetools/bin
cp -r ${GLUETOOLS_REPO}/gluetools-core/gluetools/bin/gluetools.sh ~/gluetools/bin
cp -r ${GLUETUTORIAL_REPO}/scripts/glueWipeDatabase.sh ~/gluetools/bin
cp -r ${GLUETUTORIAL_REPO}/scripts/glueUpdateEngine.sh ~/gluetools/bin
cp -r ${GLUETUTORIAL_REPO}/scripts/installGlueProject.sh ~/gluetools/bin
chmod u+x ~/gluetools/bin/*.sh

export GLUETOOLS_TMP=${HOME}/gluetools/tmp

mkdir -p ~/gluetools/conf
cp -r ${GLUETUTORIAL_REPO}/gluetools-config.xml ~/gluetools/conf

if [ "${HOSTNAME}" == "cardff-glue.novalocal" ]
then
	sed -i -e 's/home2\/sing01j\/blast/opt\/gluetools\/blast/g' ~/gluetools/conf/gluetools-config.xml
	sed -i -e 's/home2\/sing01j\/raxml/opt\/gluetools\/raxml/g' ~/gluetools/conf/gluetools-config.xml
	sed -i -e 's/home2\/sing01j\/mafft/usr\/local/g' ~/gluetools/conf/gluetools-config.xml
fi

sed -i -e 's/DBUSERNAME/'${GLUETOOLS_USER}'/g' ~/gluetools/conf/gluetools-config.xml
sed -i -e 's/DBNAME/'${GLUETOOLS_DB}'/g' ~/gluetools/conf/gluetools-config.xml
sed -i -e 's/glue12345/'${GLUETOOLS_PASSWORD}'/g' ~/gluetools/conf/gluetools-config.xml
sed -i -e 's|USER_GT_TMP|'${GLUETOOLS_TMP}'|g' ~/gluetools/conf/gluetools-config.xml
sed -i -e 's|USER_THREADS|'${GLUE_THREADS}'|g' ~/gluetools/conf/gluetools-config.xml

sed -i -e 's/glue12345/'${GLUETOOLS_PASSWORD}'/g' ~/gluetools/conf/gluetools-config.xml
sed -i -e 's/glue12345/'${GLUETOOLS_PASSWORD}'/g' ~/gluetools/bin/glueWipeDatabase.sh
sed -i -e 's/glue12345/'${GLUETOOLS_PASSWORD}'/g' ~/gluetools/bin/installGlueProject.sh


mkdir -p ~/gluetools/lib
rm -rf ~/gluetools/lib/*.jar
cp -p "`ls -dtr1 ${GLUETOOLS_JAR_DIRECTORY}/* | tail -1`" ~/gluetools/lib

mkdir -p ~/gluetools/projects
cp -r ${GLUETOOLS_REPO}/gluetools-core/exampleProject ~/gluetools/projects

mkdir -p ~/gluetools/tmp
mkdir -p ~/gluetools/tmp/blastdbs
mkdir -p ~/gluetools/tmp/blastfiles
mkdir -p ~/gluetools/tmp/mafftfiles
mkdir -p ~/gluetools/tmp/raxmlfiles
mkdir -p ~/gluetools/tmp/tbl2asnfiles
mkdir -p ~/gluetools/tmp/samfiles

echo "Creating .gluerc"
echo "console set log-level FINEST" > .gluerc
echo "console add option-line load-save-path" >> .gluerc
echo "console set table-result-float-precision 2" >> .gluerc

echo "Updating ~/.bash_profile ..."

if [ -f ~/.bash_profile ]; then
	# delete any previous GLUE env. variable lines from .bash_profile
	sed -i '/GLUE_JAVA_HOME/d' ~/.bash_profile
	sed -i '/GLUE_HOME/d' ~/.bash_profile
fi

if [ "${HOSTNAME}" == "cardff-glue.novalocal" ]; then
echo "export GLUE_JAVA_HOME=/usr" >> ~/.bash_profile
fi
echo "export GLUE_HOME=~${USER}/gluetools" >> ~/.bash_profile
echo "export PATH=\${PATH}:\${GLUE_HOME}/bin" >> ~/.bash_profile

echo "GLUE installation complete"
echo "Log in again or run source ~/.bash_profile to add gluetools.sh to your PATH"