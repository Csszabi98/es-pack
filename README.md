![espack](./apps/espack/assets/espack.png)

# @espack monorepository

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
If you have any questions contact the repository owner via 
<a href="mailto:csizmadia98@gmail.com?"><img src="https://img.shields.io/badge/gmail-%23DD0031.svg?&style=for-the-badge&logo=gmail&logoColor=white"/></a>

