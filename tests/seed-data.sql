-- PortOps - Dados de Teste
-- Executar: psql -U postgres -d portops_test -f tests/seed-data.sql

-- Limpar dados existentes (opcional)
-- DELETE FROM timeline_events;
-- DELETE FROM files;
-- DELETE FROM invoices;
-- DELETE FROM milestones;
-- DELETE FROM authorizations;
-- DELETE FROM processes;

-- Inserir 10 processos de teste
INSERT INTO processes (id, "fileNumber", "srfNumber", "vesselName", imo, client, port, terminal, coordinator, status, progress, "createdAt", "updatedAt") VALUES
('test-1', '100001', 'SRF-2026-1001', 'MSC AURORA', '9839012', 'MSC — Mediterranean Shipping Company', 'Porto de Sines', 'Terminal XXI', 'Carlos Mendes', 'OPEN', 25, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
('test-2', '100002', 'SRF-2026-1002', 'MAERSK EDINBURGH', '9712456', 'Maersk Line', 'Porto de Leixões', 'Terminal de Contentores', 'Ana Rodrigues', 'OPEN', 50, NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days'),
('test-3', '100003', 'SRF-2026-1003', 'CMA CGM MARCO POLO', '9454468', 'CMA CGM Group', 'Porto de Lisboa', 'Terminal de Alcântara', 'Pedro Santos', 'OPEN', 75, NOW() - INTERVAL '7 days', NOW() - INTERVAL '1 day'),
('test-4', '100004', 'SRF-2026-1004', 'HAPAG LLOYD BERLIN', '9678234', 'Hapag-Lloyd AG', 'Porto de Sines', 'Terminal XXI', 'Carlos Mendes', 'CLOSED', 100, NOW() - INTERVAL '10 days', NOW() - INTERVAL '1 day'),
('test-5', '100005', 'SRF-2026-1005', 'EVER GIVEN', '9811000', 'Evergreen Marine', 'Porto de Sines', 'Terminal XXI', 'Maria Ferreira', 'CLOSED', 100, NOW() - INTERVAL '15 days', NOW() - INTERVAL '5 days');

-- Inserir autorizações para cada processo (5 por processo)
INSERT INTO authorizations (id, "processId", entity, reason, status, "receivedAt") VALUES
-- Processo 1
('auth-1-1', 'test-1', 'Saúde Portuária', 'Inspeção sanitária do navio', 'RECEIVED', NOW() - INTERVAL '4 days'),
('auth-1-2', 'test-1', 'Alfândega', 'Declaração de carga e manifesto', 'PENDING', NULL),
('auth-1-3', 'test-1', 'Imigração', 'Controlo de tripulação', 'PENDING', NULL),
('auth-1-4', 'test-1', 'Polícia Marítima', 'Segurança portuária', 'NOT_APPLICABLE', NULL),
('auth-1-5', 'test-1', 'Intransmar', 'Agência marítima', 'PENDING', NULL),

-- Processo 2
('auth-2-1', 'test-2', 'Saúde Portuária', 'Inspeção sanitária do navio', 'RECEIVED', NOW() - INTERVAL '2 days'),
('auth-2-2', 'test-2', 'Alfândega', 'Declaração de carga e manifesto', 'RECEIVED', NOW() - INTERVAL '2 days'),
('auth-2-3', 'test-2', 'Imigração', 'Controlo de tripulação', 'PENDING', NULL),
('auth-2-4', 'test-2', 'Polícia Marítima', 'Segurança portuária', 'RECEIVED', NOW() - INTERVAL '2 days'),
('auth-2-5', 'test-2', 'Intransmar', 'Agência marítima', 'PENDING', NULL),

-- Processo 3
('auth-3-1', 'test-3', 'Saúde Portuária', 'Inspeção sanitária do navio', 'RECEIVED', NOW() - INTERVAL '6 days'),
('auth-3-2', 'test-3', 'Alfândega', 'Declaração de carga e manifesto', 'RECEIVED', NOW() - INTERVAL '6 days'),
('auth-3-3', 'test-3', 'Imigração', 'Controlo de tripulação', 'RECEIVED', NOW() - INTERVAL '6 days'),
('auth-3-4', 'test-3', 'Polícia Marítima', 'Segurança portuária', 'RECEIVED', NOW() - INTERVAL '6 days'),
('auth-3-5', 'test-3', 'Intransmar', 'Agência marítima', 'RECEIVED', NOW() - INTERVAL '6 days'),

-- Processo 4 (fechado)
('auth-4-1', 'test-4', 'Saúde Portuária', 'Inspeção sanitária do navio', 'RECEIVED', NOW() - INTERVAL '9 days'),
('auth-4-2', 'test-4', 'Alfândega', 'Declaração de carga e manifesto', 'RECEIVED', NOW() - INTERVAL '9 days'),
('auth-4-3', 'test-4', 'Imigração', 'Controlo de tripulação', 'RECEIVED', NOW() - INTERVAL '9 days'),
('auth-4-4', 'test-4', 'Polícia Marítima', 'Segurança portuária', 'RECEIVED', NOW() - INTERVAL '9 days'),
('auth-4-5', 'test-4', 'Intransmar', 'Agência marítima', 'RECEIVED', NOW() - INTERVAL '9 days'),

-- Processo 5 (fechado)
('auth-5-1', 'test-5', 'Saúde Portuária', 'Inspeção sanitária do navio', 'RECEIVED', NOW() - INTERVAL '14 days'),
('auth-5-2', 'test-5', 'Alfândega', 'Declaração de carga e manifesto', 'RECEIVED', NOW() - INTERVAL '14 days'),
('auth-5-3', 'test-5', 'Imigração', 'Controlo de tripulação', 'RECEIVED', NOW() - INTERVAL '14 days'),
('auth-5-4', 'test-5', 'Polícia Marítima', 'Segurança portuária', 'RECEIVED', NOW() - INTERVAL '14 days'),
('auth-5-5', 'test-5', 'Intransmar', 'Agência marítima', 'RECEIVED', NOW() - INTERVAL '14 days');

-- Inserir marcos para cada processo (10 por processo)
INSERT INTO milestones (id, "processId", name, description, "order", confirmed, date) VALUES
-- Processo 1
('ms-1-1', 'test-1', 'Receção do Pedido', 'Pedido recebido do cliente', 1, true, NOW() - INTERVAL '5 days'),
('ms-1-2', 'test-1', 'Agendamento', 'Escala agendada com o porto', 2, true, NOW() - INTERVAL '4 days'),
('ms-1-3', 'test-1', 'Notificação Autoridades', 'Comunicação às entidades portuárias', 3, false, NULL),
('ms-1-4', 'test-1', 'Chegada do Navio (ATA)', 'Navio atracado no terminal', 4, false, NULL),
('ms-1-5', 'test-1', 'Início de Operações', 'Operações de carga/descarga iniciadas', 5, false, NULL),
('ms-1-6', 'test-1', 'Fim de Operações', 'Operações concluídas', 6, false, NULL),
('ms-1-7', 'test-1', 'Partida do Navio (ATD)', 'Navio deixou o porto', 7, false, NULL),
('ms-1-8', 'test-1', 'Recolha de Faturas', 'Todas as faturas recebidas', 8, false, NULL),
('ms-1-9', 'test-1', 'Handover Financeiro', 'Entregue à contabilidade', 9, false, NULL),
('ms-1-10', 'test-1', 'Encerramento', 'Ficheiro encerrado', 10, false, NULL),

-- Processo 2
('ms-2-1', 'test-2', 'Receção do Pedido', 'Pedido recebido do cliente', 1, true, NOW() - INTERVAL '3 days'),
('ms-2-2', 'test-2', 'Agendamento', 'Escala agendada com o porto', 2, true, NOW() - INTERVAL '3 days'),
('ms-2-3', 'test-2', 'Notificação Autoridades', 'Comunicação às entidades portuárias', 3, true, NOW() - INTERVAL '2 days'),
('ms-2-4', 'test-2', 'Chegada do Navio (ATA)', 'Navio atracado no terminal', 4, true, NOW() - INTERVAL '2 days'),
('ms-2-5', 'test-2', 'Início de Operações', 'Operações de carga/descarga iniciadas', 5, true, NOW() - INTERVAL '1 day'),
('ms-2-6', 'test-2', 'Fim de Operações', 'Operações concluídas', 6, false, NULL),
('ms-2-7', 'test-2', 'Partida do Navio (ATD)', 'Navio deixou o porto', 7, false, NULL),
('ms-2-8', 'test-2', 'Recolha de Faturas', 'Todas as faturas recebidas', 8, false, NULL),
('ms-2-9', 'test-2', 'Handover Financeiro', 'Entregue à contabilidade', 9, false, NULL),
('ms-2-10', 'test-2', 'Encerramento', 'Ficheiro encerrado', 10, false, NULL),

-- Processo 3
('ms-3-1', 'test-3', 'Receção do Pedido', 'Pedido recebido do cliente', 1, true, NOW() - INTERVAL '7 days'),
('ms-3-2', 'test-3', 'Agendamento', 'Escala agendada com o porto', 2, true, NOW() - INTERVAL '6 days'),
('ms-3-3', 'test-3', 'Notificação Autoridades', 'Comunicação às entidades portuárias', 3, true, NOW() - INTERVAL '6 days'),
('ms-3-4', 'test-3', 'Chegada do Navio (ATA)', 'Navio atracado no terminal', 4, true, NOW() - INTERVAL '5 days'),
('ms-3-5', 'test-3', 'Início de Operações', 'Operações de carga/descarga iniciadas', 5, true, NOW() - INTERVAL '4 days'),
('ms-3-6', 'test-3', 'Fim de Operações', 'Operações concluídas', 6, true, NOW() - INTERVAL '2 days'),
('ms-3-7', 'test-3', 'Partida do Navio (ATD)', 'Navio deixou o porto', 7, true, NOW() - INTERVAL '1 day'),
('ms-3-8', 'test-3', 'Recolha de Faturas', 'Todas as faturas recebidas', 8, false, NULL),
('ms-3-9', 'test-3', 'Handover Financeiro', 'Entregue à contabilidade', 9, false, NULL),
('ms-3-10', 'test-3', 'Encerramento', 'Ficheiro encerrado', 10, false, NULL),

-- Processo 4 (fechado)
('ms-4-1', 'test-4', 'Receção do Pedido', 'Pedido recebido do cliente', 1, true, NOW() - INTERVAL '10 days'),
('ms-4-2', 'test-4', 'Agendamento', 'Escala agendada com o porto', 2, true, NOW() - INTERVAL '9 days'),
('ms-4-3', 'test-4', 'Notificação Autoridades', 'Comunicação às entidades portuárias', 3, true, NOW() - INTERVAL '9 days'),
('ms-4-4', 'test-4', 'Chegada do Navio (ATA)', 'Navio atracado no terminal', 4, true, NOW() - INTERVAL '8 days'),
('ms-4-5', 'test-4', 'Início de Operações', 'Operações de carga/descarga iniciadas', 5, true, NOW() - INTERVAL '7 days'),
('ms-4-6', 'test-4', 'Fim de Operações', 'Operações concluídas', 6, true, NOW() - INTERVAL '5 days'),
('ms-4-7', 'test-4', 'Partida do Navio (ATD)', 'Navio deixou o porto', 7, true, NOW() - INTERVAL '4 days'),
('ms-4-8', 'test-4', 'Recolha de Faturas', 'Todas as faturas recebidas', 8, true, NOW() - INTERVAL '3 days'),
('ms-4-9', 'test-4', 'Handover Financeiro', 'Entregue à contabilidade', 9, true, NOW() - INTERVAL '2 days'),
('ms-4-10', 'test-4', 'Encerramento', 'Ficheiro encerrado', 10, true, NOW() - INTERVAL '1 day'),

-- Processo 5 (fechado)
('ms-5-1', 'test-5', 'Receção do Pedido', 'Pedido recebido do cliente', 1, true, NOW() - INTERVAL '15 days'),
('ms-5-2', 'test-5', 'Agendamento', 'Escala agendada com o porto', 2, true, NOW() - INTERVAL '14 days'),
('ms-5-3', 'test-5', 'Notificação Autoridades', 'Comunicação às entidades portuárias', 3, true, NOW() - INTERVAL '14 days'),
('ms-5-4', 'test-5', 'Chegada do Navio (ATA)', 'Navio atracado no terminal', 4, true, NOW() - INTERVAL '13 days'),
('ms-5-5', 'test-5', 'Início de Operações', 'Operações de carga/descarga iniciadas', 5, true, NOW() - INTERVAL '12 days'),
('ms-5-6', 'test-5', 'Fim de Operações', 'Operações concluídas', 6, true, NOW() - INTERVAL '10 days'),
('ms-5-7', 'test-5', 'Partida do Navio (ATD)', 'Navio deixou o porto', 7, true, NOW() - INTERVAL '9 days'),
('ms-5-8', 'test-5', 'Recolha de Faturas', 'Todas as faturas recebidas', 8, true, NOW() - INTERVAL '8 days'),
('ms-5-9', 'test-5', 'Handover Financeiro', 'Entregue à contabilidade', 9, true, NOW() - INTERVAL '7 days'),
('ms-5-10', 'test-5', 'Encerramento', 'Ficheiro encerrado', 10, true, NOW() - INTERVAL '5 days');

-- Inserir faturas para cada processo (6 por processo)
INSERT INTO invoices (id, "processId", entity, description, status, amount, reference, "receivedAt") VALUES
-- Processo 1
('inv-1-1', 'test-1', 'PBT', 'Port Charges — Taxas Portuárias', 'RECEIVED', 45000, 'INV-2026-001', NOW() - INTERVAL '3 days'),
('inv-1-2', 'test-1', 'Terminal', 'Taxas de Terminal — Movimentação', 'AWAITING', NULL, NULL, NULL),
('inv-1-3', 'test-1', 'Rebocadores', 'Serviço de Rebocagem', 'AWAITING', NULL, NULL, NULL),
('inv-1-4', 'test-1', 'Praticagem', 'Serviço de Praticagem', 'AWAITING', NULL, NULL, NULL),
('inv-1-5', 'test-1', 'Amarradores', 'Serviço de Amarração', 'AWAITING', NULL, NULL, NULL),
('inv-1-6', 'test-1', 'Agência', 'Taxas de Agência Marítima', 'AWAITING', NULL, NULL, NULL),

-- Processo 2
('inv-2-1', 'test-2', 'PBT', 'Port Charges — Taxas Portuárias', 'RECEIVED', 52000, 'INV-2026-010', NOW() - INTERVAL '2 days'),
('inv-2-2', 'test-2', 'Terminal', 'Taxas de Terminal — Movimentação', 'RECEIVED', 31000, 'INV-2026-011', NOW() - INTERVAL '2 days'),
('inv-2-3', 'test-2', 'Rebocadores', 'Serviço de Rebocagem', 'RECEIVED', 8500, 'INV-2026-012', NOW() - INTERVAL '1 day'),
('inv-2-4', 'test-2', 'Praticagem', 'Serviço de Praticagem', 'AWAITING', NULL, NULL, NULL),
('inv-2-5', 'test-2', 'Amarradores', 'Serviço de Amarração', 'AWAITING', NULL, NULL, NULL),
('inv-2-6', 'test-2', 'Agência', 'Taxas de Agência Marítima', 'AWAITING', NULL, NULL, NULL),

-- Processo 3
('inv-3-1', 'test-3', 'PBT', 'Port Charges — Taxas Portuárias', 'RECEIVED', 48000, 'INV-2026-020', NOW() - INTERVAL '5 days'),
('inv-3-2', 'test-3', 'Terminal', 'Taxas de Terminal — Movimentação', 'RECEIVED', 29000, 'INV-2026-021', NOW() - INTERVAL '4 days'),
('inv-3-3', 'test-3', 'Rebocadores', 'Serviço de Rebocagem', 'RECEIVED', 9200, 'INV-2026-022', NOW() - INTERVAL '3 days'),
('inv-3-4', 'test-3', 'Praticagem', 'Serviço de Praticagem', 'RECEIVED', 6500, 'INV-2026-023', NOW() - INTERVAL '2 days'),
('inv-3-5', 'test-3', 'Amarradores', 'Serviço de Amarração', 'AWAITING', NULL, NULL, NULL),
('inv-3-6', 'test-3', 'Agência', 'Taxas de Agência Marítima', 'AWAITING', NULL, NULL, NULL),

-- Processo 4 (fechado)
('inv-4-1', 'test-4', 'PBT', 'Port Charges — Taxas Portuárias', 'RECEIVED', 55000, 'INV-2026-030', NOW() - INTERVAL '8 days'),
('inv-4-2', 'test-4', 'Terminal', 'Taxas de Terminal — Movimentação', 'RECEIVED', 33000, 'INV-2026-031', NOW() - INTERVAL '7 days'),
('inv-4-3', 'test-4', 'Rebocadores', 'Serviço de Rebocagem', 'RECEIVED', 9800, 'INV-2026-032', NOW() - INTERVAL '6 days'),
('inv-4-4', 'test-4', 'Praticagem', 'Serviço de Praticagem', 'RECEIVED', 7200, 'INV-2026-033', NOW() - INTERVAL '5 days'),
('inv-4-5', 'test-4', 'Amarradores', 'Serviço de Amarração', 'RECEIVED', 4500, 'INV-2026-034', NOW() - INTERVAL '4 days'),
('inv-4-6', 'test-4', 'Agência', 'Taxas de Agência Marítima', 'RECEIVED', 12000, 'INV-2026-035', NOW() - INTERVAL '3 days'),

-- Processo 5 (fechado)
('inv-5-1', 'test-5', 'PBT', 'Port Charges — Taxas Portuárias', 'RECEIVED', 62000, 'INV-2026-040', NOW() - INTERVAL '13 days'),
('inv-5-2', 'test-5', 'Terminal', 'Taxas de Terminal — Movimentação', 'RECEIVED', 38000, 'INV-2026-041', NOW() - INTERVAL '12 days'),
('inv-5-3', 'test-5', 'Rebocadores', 'Serviço de Rebocagem', 'RECEIVED', 11500, 'INV-2026-042', NOW() - INTERVAL '11 days'),
('inv-5-4', 'test-5', 'Praticagem', 'Serviço de Praticagem', 'RECEIVED', 8800, 'INV-2026-043', NOW() - INTERVAL '10 days'),
('inv-5-5', 'test-5', 'Amarradores', 'Serviço de Amarração', 'RECEIVED', 5200, 'INV-2026-044', NOW() - INTERVAL '9 days'),
('inv-5-6', 'test-5', 'Agência', 'Taxas de Agência Marítima', 'RECEIVED', 15000, 'INV-2026-045', NOW() - INTERVAL '8 days');

-- Inserir eventos de timeline
INSERT INTO timeline_events (id, "processId", action, description, "user", timestamp) VALUES
-- Processo 1
('evt-1-1', 'test-1', 'Ficheiro Criado', 'Operação registada para MSC AURORA', 'Sistema', NOW() - INTERVAL '5 days'),
('evt-1-2', 'test-1', 'Autorização Atualizada', 'Saúde Portuária: Recebida', 'Coordenador', NOW() - INTERVAL '4 days'),

-- Processo 2
('evt-2-1', 'test-2', 'Ficheiro Criado', 'Operação registada para MAERSK EDINBURGH', 'Sistema', NOW() - INTERVAL '3 days'),
('evt-2-2', 'test-2', 'Marco Confirmado', 'Chegada do Navio (ATA)', 'Coordenador', NOW() - INTERVAL '2 days'),
('evt-2-3', 'test-2', 'Fatura Atualizada', 'PBT — Recebida', 'Financeiro', NOW() - INTERVAL '2 days'),

-- Processo 3
('evt-3-1', 'test-3', 'Ficheiro Criado', 'Operação registada para CMA CGM MARCO POLO', 'Sistema', NOW() - INTERVAL '7 days'),
('evt-3-2', 'test-3', 'Marco Confirmado', 'Partida do Navio (ATD)', 'Coordenador', NOW() - INTERVAL '1 day'),

-- Processo 4
('evt-4-1', 'test-4', 'Ficheiro Criado', 'Operação registada para HAPAG LLOYD BERLIN', 'Sistema', NOW() - INTERVAL '10 days'),
('evt-4-2', 'test-4', 'Ficheiro Encerrado', 'Operação encerrada — todas as pendências resolvidas', 'Coordenador', NOW() - INTERVAL '1 day'),

-- Processo 5
('evt-5-1', 'test-5', 'Ficheiro Criado', 'Operação registada para EVER GIVEN', 'Sistema', NOW() - INTERVAL '15 days'),
('evt-5-2', 'test-5', 'Ficheiro Encerrado', 'Operação encerrada — todas as pendências resolvidas', 'Coordenador', NOW() - INTERVAL '5 days');

-- Verificar resultados
SELECT 'Processos: ' || COUNT(*) FROM processes;
SELECT 'Autorizações: ' || COUNT(*) FROM authorizations;
SELECT 'Marcos: ' || COUNT(*) FROM milestones;
SELECT 'Faturas: ' || COUNT(*) FROM invoices;
SELECT 'Eventos: ' || COUNT(*) FROM timeline_events;
