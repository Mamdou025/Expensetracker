{ pkgs }: {
  deps = [
    pkgs.nodejs-20_x
    pkgs.python313Full
    pkgs.gnumake
    pkgs.gcc
    pkgs.pkg-config
    pkgs.sqlite
  ];
}
