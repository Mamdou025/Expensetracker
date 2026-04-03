{ pkgs }: {
  deps = [
    pkgs.nodejs-16_x
    pkgs.python39Full
    pkgs.python39Packages.pip
    pkgs.sqlite
  ];
}
