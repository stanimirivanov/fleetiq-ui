// FleetIQ's edge uses the same standard module set as the upstream Caddy binary.
// Building it in a locked module allows security fixes for Go dependencies to
// ship before the next upstream container release.
package main

import (
	_ "time/tzdata"

	caddycmd "github.com/caddyserver/caddy/v2/cmd"
	_ "github.com/caddyserver/caddy/v2/modules/standard"
)

func main() {
	caddycmd.Main()
}
