#!/bin/bash

export APPLI_HOME=/opt/authokta/apps/updateIDPKeys
export OKTA_KEY_DIRECTORY=/opt/authokta/nodeapps/apps/resources/okta-keys
export LOG_FILE=${APPLI_HOME}/trace.log

cd ${APPLI_HOME}
./xRetrieveOktaKeys.sh  ${OKTA_KEY_DIRECTORY} engie.okta-emea.com > ${LOG_FILE}