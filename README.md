# asdf

## How this comes?

1- cnpm preparation

```
$ npm install -g cnpm --registry=https://registry.npm.taobao.org
```

2- express generation

```
$ cnpm install -g express-generator
$ express -v ejs asdf
```

3- dry run

```
$ cd asdf
$ bin/www

```

$ open http://localhost:3000

## Use github

1- login to github.com and create a repo asdf

2- prepare .gitignore

3- init local repo and push

```
git init
git add .
git commit -m 'first commit'
git remote add origin git@github.com:hmisty/asdf.git
git push -u origin master
```


