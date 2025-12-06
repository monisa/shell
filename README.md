# octa-multi-tenant — Shell App (Task 1)

This repository contains the shell app scaffold for the Octa multi-tenant project.

Goal (Task 1)
- Create a clean Angular Shell app named `octa-multi-tenant`.
- Provide routing, global SCSS for future theme variables, and placeholder layout areas (header / sidebar / content).

Quick setup (Angular CLI required)
1. Ensure Node.js (16+) and npm are installed.
2. Install Angular CLI if you don't have it:
   npm install -g @angular/cli

3. Clone the repo and create the Angular app inside it (recommended when repo is empty):
   git clone https://github.com/monisa/shell.git
   cd shell
   ng new . --name=octa-multi-tenant --routing --style=scss --skip-git

4. Replace/merge the src/ files with the files in this repository (create them if needed).

5. Create the branch, commit, and push:
   git checkout -b task1-shell-setup
   git add .
   git commit -m "Task 1: initial shell scaffold (routing, global scss, header/sidebar/content placeholders)"
   git push -u origin task1-shell-setup

6. Install dependencies and serve:
   npm install
   ng serve

7. Open http://localhost:4200 — you should see the shell layout with header, sidebar, and content area.

Acceptance criteria checklist
- Angular workspace created successfully via Angular CLI
- App builds and serves with ng serve
- Routing module configured (src/app/app-routing.module.ts)
- Basic header / sidebar / content placeholder present (src/app/**)
- Global SCSS file src/styles.scss created for future theme variables

Notes
- If you prefer I push these files directly, enable repository write access or ensure the remote has at least one branch so I can push an initial commit.
- Next: I'll implement the ThemeService (runtime JSON loader, CSS variable conversion, cache) and IconService once Task 1 is merged/available.
