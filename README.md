<p align="center">
  <img src="https://user-images.githubusercontent.com/38193720/116794320-7b15ab00-aacc-11eb-8b4f-71aafd37b5eb.png" 
    alt="espack: A build tool running on esbuild">
  <br>
  <a href="https://github.com/Csszabi98/es-pack/tree/main/apps/espack">espack</a> |
  <a href="https://github.com/Csszabi98/es-pack/tree/main/plugins">plugins</a> |
  <a href="https://github.com/Csszabi98/es-pack/tree/main/templates">templates</a>
</p>

# @es-pack monorepository

This is the monorepository for espack a build tool running on esbuild.

## Technology stack

- esbuild for bundling 
- typescript
- nodejs
- rush for repository management

## Development requirements
- Have at least node 12 installed
- Install [rush](https://rushjs.io/)

## How to do things?
- After checking out the repo run the following command to initialize the repository:
```shell
rush update
```
- Run the following command to build the underlying projects: 
```shell
rush build
```
- Or run the following command to od a development build:
```shell
rush build:dev
```
- Watch mode:
```shell
rush build:watch
```
- To lint the project run:
```shell
rush lint
```
- To fix the lint issues run:
```shell
rush lint:fix
```

## Additional info

- prettier runs before each commit to the repository and fixes files to meet the configuration standards
- a commit format of [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/#specification) is used, and
commitlint runs before every commit to enforce these rules

## Contributing

Feel free to contribute to the repository by any means, but do it in a documented format, via github issues.

## Contact
If you have any questions contact the repository owner via email: **csizmadia98@gmail.com**
