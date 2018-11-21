#!/bin/bash

#Parameters
export APPLI_NAME=$2

#Set env variables
. ./nodeenv.sh


# Process options
NODE_PID="${APP_PATH}/${APPLI_NAME}.pid"



# Helper functions
pid_running() {
  if [ -f "${NODE_PID}" ] ; then (
    PIDTEXT=`cat ${NODE_PID}`;
    PID=`printf "%d" ${PIDTEXT}`;
    if [ ${PID} -eq 0 ]; then
      return 1;
    fi;
    (ps -e -o pid | egrep -- "^ *${PID}$" >/dev/null);
    return $?);
  else
    return 1;
  fi
}

pid_exited() {
  if pid_running ; then
    return 1;
  else
    return 0;
  fi
}

wait_for_pid() {
  TRYCOUNT=0
  while [ $TRYCOUNT -lt 45 ]
  do
    if pid_exited; then
      return 0
    fi
    TRYCOUNT=`expr $TRYCOUNT + 1`
    sleep 1
  done
  # Too many tries; give up
  return 1
}

ensureNotRunning() {
    if [ ! -z "${NODE_PID}" ]; then
        if pid_running ; then
            echo "Node App ${APPLI_NAME} is already running."
            exit 33
        fi
    fi
}


cd ${APP_PATH}/${APPLI_NAME}


if [ "$1" = "start" ] ; then
    ensureNotRunning

    nohup node ${APP_PATH}/${APPLI_NAME}/index.js  &
    if [ ! -z "${NODE_PID}" ]; then

            echo $! > "${NODE_PID}"
    fi

elif [ "$1" = "status" ] ; then
	if pid_running ; then
		echo "The service is running."
	else
		echo "The service is not running !"
	fi	
elif [ "$1" = "stop" ] ; then
   
  FORCE=0
  if [ "$3" = "-force" ]; then
    shift
    FORCE=1
  fi

  if [ $FORCE -eq 0 ]; then
    if [ -n "${NODE_PID}" ] && [ -f "${NODE_PID}" ]; then
        # signal process to stop
        kill -TERM $(<"${NODE_PID}") >/dev/null 2>&1

        if wait_for_pid; then
          exit 0
        fi
    else
        echo "Shutdown failed -- unable to determine process ID, use --force"
        exit 21
    fi

    echo "Shutdown failed -- must use -force"
    exit 21
  fi

  if [ $FORCE -eq 0 ]; then
    echo "Shutdown failed -- to forcibly terminate the process, use -force"
    exit 21
  fi

  if [ $FORCE -eq 1 ]; then
    if [ ! -z "$NODE_PID" ]; then
       echo "Killing: `cat $NODE_PID`"
       kill -9 `cat $NODE_PID`
       exit 0
    else
       echo "Kill failed: \$NODE_PID not set"
       exit 21;
    fi
  fi


fi
