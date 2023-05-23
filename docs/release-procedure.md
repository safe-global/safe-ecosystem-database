# Releasing to production

The code is being actively developed on the `main` branch. Pull requests are made against this branch.

After a pull request is approved, the code is merged to the `main` branch.

To deploy it to staging, you can manually run the [`Deploy Data to Staging`](https://github.com/safe-global/safe-ecosystem-database/actions/workflows/deploy.yml) workflow on `main`.

### Tag & release
* Switch to the main branch and make sure it's up-to-date:
```
git checkout main
git fetch --all
git reset --hard origin/main
```
* Create and push a new version tag :
```
git tag v1.1.0
git push --tags
```

* Create a [GitHub release](https://github.com/safe-global/safe-ecosystem-database/releases) for this tag
* Notify devops on Slack and send them the release link to deploy to production