const express = require('express');
const server = express();
server.use(express.json());
const bodyParser = require('body-parser');
const handlebars = require('express-handlebars');
const mysql = require('mysql');
const path = require('path');

server.use(express.json());
server.engine('handlebars', handlebars.engine({ 
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, 'views/layouts')
}));

server.set('view engine', 'handlebars');
server.use(bodyParser.urlencoded({ extended: false }));
server.use(bodyParser.json());
server.use(express.static('public'));


const connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : 'pantera2256!',
    database : 'clinica'
})

connection.connect(function(err) {
    if (err) {
        console.error('error connecting: ' + err.stack);
    }else{
        console.log('connected as id ' + connection.threadId);
    }
})

var sit = "Entrar";
var msg;
var id_atual = 0;
var usuario_atual = "Bem Vindo";
var cargo;

//ROTAS

server.get('/', (req, res) => {
    return res.render('index',{sit, usuario_atual,titulo: 'Clinica X'});
})

server.get('/login', (req, res) => {
    if(sit == "Entrar"){
        return res.render('login',{titulo:'LOGIN', layout: false});
    }else{
        sit = "Entrar";
        id_atual = 0;
        usuario_atual = "Bem Vindo";
        res.redirect('/');
    }
    
})

server.post ('/valida-login', (req,res) => {
    var usuario = req.body.usuario;
    var senha = req.body.senha;

    connection.query('SELECT * FROM usuarios WHERE usuario=? AND senha=?',[usuario, senha], function (error, results) {
        if (error || results == ""){
            msg = "Usuário ou Senha, Inválidos";
            res.render('login', {msg, titulo:'LOGIN', layout: false});
        }else{
            results.map(function(item){
                id_atual = item.id_usuario;
                usuario_atual = item.nome;
                cargo = item.cargo;
            })
            sit = "Sair";
            res.redirect('/');
        }
    });
})

server.get('/portal',(req, res) => {
    if(sit=="Entrar"){
        res.redirect('/login');
    }else if (cargo == "admin" || cargo == "gerente"){
        connection.query('SELECT * FROM usuarios', function (error, results, fields) {
            var usuarios = results;
            res.render('portal', {cargo, sit, usuario_atual, titulo: 'PORTAL', usuarios});
        })
        
    }
})

server.get('/cadastro',(req, res) => {
    if(sit=="Entrar"){
        res.redirect('/login');
    }else{
        res.render('cadastro',{cargo, sit, usuario_atual, titulo: 'PORTAL',msg});
    }
    
})

server.post ('/valida-cadastro', (req,res) => {
    var usuario = req.body.usuario;
    var senha = req.body.senha;
    var nome = req.body.nome;
    var cargo = req.body.cargo;

    connection.query('INSERT INTO usuarios (usuario,senha,nome,cargo) values (?, ?, ?, ?)',[usuario, senha, nome, cargo], function (error, results) {
        if(error){
            msg = 'Erro ao Adicionar: '+error;
            res.redirect('/cadastro');
        }else{
            res.redirect('/portal');
        }
    });
})



server.listen(3000); 