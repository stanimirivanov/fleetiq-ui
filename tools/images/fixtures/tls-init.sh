#!/bin/sh
# Fresh synthetic CA and leaf keys stay only in this owned Docker volume.
set -eu
umask 077
mkdir -m 0700 /tls/private
mkdir -m 0755 /tls/public /tls/edge
openssl req -x509 -newkey rsa:2048 -noenc -days 1 \
  -subj '/CN=FleetIQ image qualification CA' \
  -addext 'basicConstraints=critical,CA:TRUE' \
  -addext 'keyUsage=critical,keyCertSign,cRLSign' \
  -keyout /tls/private/ca.key -out /tls/public/ca.crt >/dev/null 2>&1
openssl req -newkey rsa:2048 -noenc -subj '/CN=fleet.test' \
  -keyout /tls/edge/tls.key -out /tls/private/tls.csr >/dev/null 2>&1
printf '%s\n' 'subjectAltName=DNS:fleet.test' 'basicConstraints=critical,CA:FALSE' \
  'keyUsage=critical,digitalSignature,keyEncipherment' 'extendedKeyUsage=serverAuth' > /tls/private/leaf.ext
openssl x509 -req -days 1 -in /tls/private/tls.csr \
  -CA /tls/public/ca.crt -CAkey /tls/private/ca.key -CAcreateserial \
  -extfile /tls/private/leaf.ext -out /tls/edge/tls.crt >/dev/null 2>&1
chmod 0644 /tls/public/ca.crt /tls/edge/tls.crt
chown -R 10001:10001 /tls/edge
