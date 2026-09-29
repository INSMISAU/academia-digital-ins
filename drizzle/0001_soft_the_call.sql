ALTER TABLE `enrollments` ADD `visitorKey` text;--> statement-breakpoint
CREATE INDEX `enrollment_visitor` ON `enrollments` (`visitorKey`);
--> statement-breakpoint
INSERT OR IGNORE INTO courses (id,title,summary,category,status,hours,pass,version,external,updated) VALUES ('orientacao','Introdução à Academia Digital','Experimente o percurso completo: estudar, retomar, realizar uma avaliação e obter um certificado de demonstração.','Competências digitais','publicado',1,80,1,NULL,'2026-09-30T00:00:00.000Z');
--> statement-breakpoint
INSERT OR IGNORE INTO courses (id,title,summary,category,status,hours,pass,version,external,updated) VALUES ('surtos','Investigação e resposta a surtos','Curso de três módulos e 28 passos. A versão existente continua disponível no seu endereço, enquanto preparamos a integração.','Vigilância epidemiológica','publicado',0,80,1,'https://insmisau.github.io/demo-modulo-surtos/','2026-09-30T00:00:00.000Z');
--> statement-breakpoint
INSERT OR IGNORE INTO courses (id,title,summary,category,status,hours,pass,version,external,updated) VALUES ('biosseguranca','Biossegurança e prevenção de infecções','Proposta de formação. Programa e conteúdos a validar pela equipa pedagógica do INS.','Saúde pública','rascunho',0,80,1,NULL,'2026-09-30T00:00:00.000Z');
--> statement-breakpoint
INSERT OR IGNORE INTO courses (id,title,summary,category,status,hours,pass,version,external,updated) VALUES ('dados','Qualidade de dados em saúde','Proposta de formação sobre registo, validação e utilização de dados. Conteúdos ainda em preparação.','Informação em saúde','rascunho',0,80,1,NULL,'2026-09-30T00:00:00.000Z');
--> statement-breakpoint
INSERT OR IGNORE INTO lessons (id,courseId,module,title,body,position) VALUES ('L1','orientacao','Primeiros passos','Conhecer o percurso','A Academia organiza a formação em cursos, módulos, aulas e avaliações.

Comece por ler os objectivos do curso. Percorra as aulas pela ordem apresentada e consulte os materiais disponibilizados. O progresso representa as aulas que marcou como concluídas.

Esta formação serve apenas para demonstrar o funcionamento da plataforma. Não substitui formação clínica nem confere uma qualificação institucional.',0);
--> statement-breakpoint
INSERT OR IGNORE INTO lessons (id,courseId,module,title,body,position) VALUES ('L2','orientacao','Primeiros passos','Guardar e retomar','Ao marcar uma aula como concluída, a Academia guarda o progresso no servidor. Aguarde a confirmação antes de fechar a página.

Pode voltar a Meus cursos e seleccionar Continuar. O percurso abre na primeira aula ainda por concluir. As tentativas de avaliação anteriores permanecem no histórico.

Se surgir uma mensagem de erro, não presuma que a operação foi gravada. Tente novamente e confirme o resultado.',1);
--> statement-breakpoint
INSERT OR IGNORE INTO lessons (id,courseId,module,title,body,position) VALUES ('L3','orientacao','Primeiros passos','Avaliação e certificado','A conclusão exige todas as aulas concluídas e a nota mínima definida no curso. Neste curso de demonstração, a nota mínima é 80%.

A avaliação é corrigida no servidor. Uma nota suficiente não substitui a conclusão das aulas.

Depois de cumprir os critérios, pode emitir um certificado de demonstração com código de verificação. Não tem assinatura nem validade oficial do INS.',2);
--> statement-breakpoint
INSERT OR IGNORE INTO questions (id,courseId,prompt,options,answer,explanation) VALUES ('Q1','orientacao','Como está organizada a formação?','["Cursos, módulos, aulas e avaliações","Apenas ficheiros avulsos","Apenas exames"]',0,'O percurso organiza conteúdos e actividades de aprendizagem.');
--> statement-breakpoint
INSERT OR IGNORE INTO questions (id,courseId,prompt,options,answer,explanation) VALUES ('Q2','orientacao','Quando deve fechar a página após concluir uma aula?','["Antes de clicar","Depois da confirmação de gravação","Logo que a internet falhe"]',1,'Aguarde a confirmação de gravação no servidor.');
--> statement-breakpoint
INSERT OR IGNORE INTO questions (id,courseId,prompt,options,answer,explanation) VALUES ('Q3','orientacao','Uma nota de 100% é suficiente se faltarem aulas?','["Sim","Não"]',1,'A conclusão exige aulas concluídas e aprovação na avaliação.');
--> statement-breakpoint
INSERT OR IGNORE INTO questions (id,courseId,prompt,options,answer,explanation) VALUES ('Q4','orientacao','Qual é a nota mínima deste curso de demonstração?','["50%","60%","80%"]',2,'A nota mínima é 80%.');
--> statement-breakpoint
INSERT OR IGNORE INTO questions (id,courseId,prompt,options,answer,explanation) VALUES ('Q5','orientacao','Este certificado tem validade oficial do INS?','["Sim","Não, é uma demonstração"]',1,'A emissão institucional depende de aprovação e assinatura autorizada.');
