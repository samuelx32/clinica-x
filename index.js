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

const multer = require('multer');

var novoNomeArquivo;

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/pdfs/')
    },
    filename: function (req, file, cb) {
        // Extração da extensão do arquivo original:
        const extensaoArquivo = file.originalname.split('.')[1];

        // Cria um código randômico que será o nome do arquivo
        novoNomeArquivo = require('crypto')
        .randomBytes(10)
        .toString('hex');

        // Indica o novo nome do arquivo:
        cb(null, `${novoNomeArquivo}.${extensaoArquivo}`)
    }
});

const upload = multer({ storage });



const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'pantera2256!',
    database: 'clinica'
})

connection.connect(function (err) {
    if (err) {
        console.error('error connecting: ' + err.stack);
    } else {
        console.log('connected as id ' + connection.threadId);
    }
})

var sit = "Entrar";
var msg;
var id_atual = 0;
var usuario_atual = "Bem Vindo";
var cargo;
var usuario_user;
var id_paciente = 0;

//ROTAS

server.get('/', (req, res) => {
    return res.render('index', { sit, usuario_atual, titulo: 'Clinica X' });
})

server.get('/login', (req, res) => {
    if (sit == "Entrar") {
        return res.render('login', { titulo: 'LOGIN', layout: false });
    } else {
        sit = "Entrar";
        id_atual = 0;
        usuario_atual = "Bem Vindo";
        res.redirect('/');
    }

})

server.post('/pdf-page', (req, res) => {
    var pdf = req.body.pdf;
    
    if (sit == "Sair") {
        res.render('pdf-page', { sit, usuario_atual, titulo: 'Clinica X', pdf});
    } else {
        res.redirect('/login');
    }
})

server.post('/valida-login', (req, res) => {
    var usuario = req.body.usuario;
    var senha = req.body.senha;

    connection.query('SELECT * FROM usuarios WHERE usuario=? AND senha=?', [usuario, senha], function (error, results) {
        if (error || results == "") {
            msg = "Usuário ou Senha, Inválidos";
            res.render('login', { msg, titulo: 'LOGIN', layout: false });
        } else {
            results.map(function (item) {
                id_atual = item.id_usuario;
                usuario_atual = item.nome;
                cargo = item.cargo;
                usuario_user = item.usuario;
            })
            sit = "Sair";
            res.redirect('/');
        }
    });
})

server.get('/portal', (req, res) => {
    var listagem;
    if (sit == "Entrar") {
        res.redirect('/login');
    } else if (cargo == "admin" || cargo == "gerente") {
        listagem = "Usuários do Sistema";
        connection.query('SELECT * FROM usuarios', function (error, results, fields) {
            var usuarios = results;
            res.render('portal', { cargo, sit, usuario_atual, listagem, usuario_user, titulo: 'PORTAL', usuarios });
        })

    } else if (cargo == "funcionario") {
        listagem = " Seus Pacientes";

        connection.query('SELECT * FROM usuarios WHERE cargo = ?', ["paciente"], function (error, results, fields) {
            var usuarios = results;
            res.render('portal', { cargo, sit, usuario_atual, listagem, usuario_user, titulo: 'PORTAL', usuarios });
        })
    }else{
        connection.query('SELECT * FROM exames WHERE id_usuario = ?', [id_atual], function (error, results, fields) {
            var exames = results;
            res.render('portal-exames', { cargo, sit, usuario_atual, listagem, usuario_user, titulo: 'PORTAL', exames });
        })
    }
})

server.get('/cadastro', (req, res) => {
    if (sit == "Entrar") {
        res.redirect('/login');
    } else {
        res.render('cadastro', { cargo, sit, usuario_atual, titulo: 'PORTAL', msg });
    }

})

server.post('/valida-cadastro', (req, res) => {
    var usuario = req.body.usuario;
    var senha = req.body.senha;
    var nome = req.body.nome;
    var cargo = req.body.cargo;

    connection.query('INSERT INTO usuarios (usuario,senha,nome,cargo) values (?, ?, ?, ?)', [usuario, senha, nome, cargo], function (error, results) {
        if (error) {
            msg = 'Erro ao Adicionar: ' + error;
            res.redirect('/cadastro');
        } else {
            res.redirect('/portal');
        }
    });
})


server.post('/usuario', (req, res) => {
    var id_usuario = req.body.id_usuario;
    var cargo_atual = req.body.cargo_atual;

    if (sit == "Sair" && cargo_atual != "paciente") {
        connection.query('SELECT * FROM usuarios WHERE id_usuario = ?', [id_usuario], function (error, results, fields) {
            var usuarios = results;
            res.render('usuario', { cargo, sit, usuario_atual, usuario_user, titulo: 'PORTAL', usuarios });
        })
    } else if (sit == "Sair") {
        connection.query('SELECT * FROM usuarios WHERE id_usuario = ?', [id_usuario], function (error, results, fields) {
            var usuarios = results;
            results.map(function (item) {
                id_paciente = item.id_usuario;
            })
            connection.query('SELECT * FROM exames WHERE id_usuario = ?', [id_paciente], function (error, results, fields) {
                var exames = results;
                res.render('paciente', { cargo, sit, usuario_atual, usuario_user, titulo: 'PORTAL', usuarios, exames });

            })
        })
    } else {
        res.redirect('/login');
    }
})

server.post('/deletar-usuario', (req, res) => {
    msg = "Deletado";

    if (sit == "Sair") {
        connection.query('DELETE FROM usuarios WHERE id_usuario=?', [req.body.id_usuario], function (error, results, fields) {
            if (error) {
                msg = "Não foi excluído: " + error;
            }
            res.render('resposta', { msg, titulo: 'Deletado', sit, usuario_atual });
        })
    } else {
        res.redirect('/login');
    }

})

server.post('/alterar-usuario', (req, res) => {
    var id = req.body.id;
    var nome = req.body.nome;
    var usuario = req.body.usuario;
    var senha = req.body.senha;
    var cargo = req.body.cargo;


    if (sit == "Sair") {
        res.render('alterar-usuario', { titulo: 'Alterar Dados', id, usuario, senha, nome, cargo });
    } else {
        res.redirect('/login');
    }

})

server.post('/alterar-usuario-exe', (req, res) => {
    msg = "Alterado";

    if (sit == "Sair") {
        connection.query('UPDATE usuarios SET usuario = ?, senha = ?, nome = ?, cargo = ? WHERE id_usuario = ?', [req.body.usuario, req.body.senha, req.body.nome, req.body.cargo, req.body.id], function (error, results, fields) {
            if (error) {
                msg = "Não foi alterado: " + error;
            }
            res.render('resposta', { msg, titulo: 'Deletado', sit, usuario_atual });
        })
    } else {
        res.redirect('/login');
    }

})

server.get('/adicionar-exame', (req, res) => {
    if (sit == "Entrar") {
        res.redirect('/login');
    } else {
        res.render('adicionar-exame', { cargo, sit, usuario_atual, titulo: 'PORTAL', msg });
    }

})

server.post('/adicionar-exame-exe', upload.single('pdf'), (req, res) => {
    var nome = req.body.nome;
    var tipo = req.body.tipo;
    var data = req.body.data;
    var pdf = novoNomeArquivo;

    connection.query('INSERT INTO exames (nome,tipo,pdf,id_usuario,data) values (?, ?, ?, ?,?)', [nome, tipo, pdf, id_paciente,data], function (error, results) {
        if (error) {
            msg = 'Erro ao Adicionar: ' + error;
            res.redirect('/adicionar-exame');
        } else {
            res.redirect('/portal');
        }
    });
})




server.post('/exame', (req, res) => {
    var id_exame = req.body.id_exame;

    if (sit == "Sair") {
        connection.query('SELECT * FROM exames WHERE id_exame = ?', [id_exame], function (error, results, fields) {
            var exames = results;
            res.render('exame', { cargo, sit, usuario_atual, usuario_user, titulo: 'PORTAL', exames });
        })
    }else {
        res.redirect('/login');
    }
})

server.post('/alterar-exame', (req, res) => {
    var id = req.body.id;
    var nome = req.body.nome;
    var tipo = req.body.tipo;
    var pdf = req.body.pdf;
    var data = req.body.data;


    if (sit == "Sair") {
        res.render('alterar-exame', { sit, titulo: 'Alterar Dados', id, nome, tipo, pdf, data });
    } else {
        res.redirect('/login');
    }

})

server.post('/alterar-exame-exe', upload.single('pdf'),(req, res) => {
    msg = "Alterado";

    if (sit == "Sair") {
        connection.query('UPDATE exames SET nome = ?, tipo = ?, pdf = ?, data = ? WHERE id_exame = ?', [req.body.nome, req.body.tipo, novoNomeArquivo, req.body.data, req.body.id], function (error, results, fields) {
            if (error) {
                msg = "Não foi alterado: " + error;
            }
            res.render('resposta', { msg, titulo: 'Alterado', sit, usuario_atual });
        })
    } else {
        res.redirect('/login');
    }

})

server.post('/deletar-exame', (req, res) => {
    msg = "Deletado";

    if (sit == "Sair") {
        connection.query('DELETE FROM exames WHERE id_exame=?', [req.body.id_exame], function (error, results, fields) {
            if (error) {
                msg = "Não foi excluído: " + error;
            }
            res.render('resposta', { msg, titulo: 'Deletado', sit, usuario_atual });
        })
    } else {
        res.redirect('/login');
    }

})

server.listen(3000); 