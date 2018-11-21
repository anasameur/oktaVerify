#!/bin/bash  

# A passer en paramèe : engie.okta-emea.com 
keys_directory=$1
okta_host=$2
id_organization_server=$3
out_file="dummy"
tmp_file=idp_response_tmp

if [ "$2" == "" ]; then
   echo "Impossible de lancer le traitement."
   echo "Parametres de lancement :"
   echo "retrieveOktaKeys.sh <keys_directory> <okta_host> <id_organization_server>"
   echo "example :"
   echo "./retrieveOktaKeys.sh /opt/nodeapps/apps/okta-keys engie.okta-emea.com"
 echo "retrieveOktaKeys.sh /opt/nodeapps/apps/okta-keys dev-180244.oktapreview.com auhse9689768hh_22528"

	exit 1
fi
#Call Okta get Keys
echo "`date` : Debut traitement "
echo "`date` : Parametres : "
echo "`date` :  - repertoire de destination : $keys_directory"
echo "`date` :  - okta host                 : $okta_host"
echo "`date` :  - id organization server    : $id_organization_server"

v_url=""
if [ "$id_organization_server" == "" ]; then
        v_url="https://$okta_host/oauth2/v1/keys"
else
        v_url="https://$okta_host/oauth2/$id_auth_server/v1/keys"
fi
	

##curl --max-time 10 -i -k ${v_url} 1>$tmp_file 2>$tmp_file.err

wget --no-check-certificate  ${v_url}  -O $tmp_file 2>$tmp_file.err



#Lecture du code retour HTTP : 
#var=`cat $tmp_file |  head -n 1 | cut -d$' ' -f2`
var=`cat $tmp_file.err | grep "HTTP" | awk  '{print $6}'`
echo "var=$var"
 
if [ "$var" == "200" ]; then

       # Copie de(s) clé) dans le fichier portant le nom du okta_host spéfién paramèe
	if [ "$id_organization_server" == "" ]; then
           out_file=${keys_directory}/${okta_host}
	else
           out_file=${keys_directory}/${okta_host}${id_organization_server}
	fi

        cat $tmp_file |  tail -n 1 > ${out_file}
        if [ "$?" == 0 ]; then
            echo "`date` : Fichier de cles mis a jour : ${out_file}"
        else
            echo "Fin de traitement KO"
            exit -1
        fi
else
  #Envoyer un mail d'alerte
  echo "`date` : Erreur :`cat $tmp_file.err`"
  echo "`date` : Fin traitement KO "
  exit 1
fi

rm $tmp_file $tmp_file.err
echo "`date` : Fin traitement OK "
exit 0


