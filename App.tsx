import 'react-native-get-random-values'; // Obrigatório estar no topo para o UUID funcionar
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, Alert, SafeAreaView } from 'react-native';
import { v4 as uuidv4 } from 'uuid';

// Importações do nosso projeto
import { initDatabase } from './src/data/local/database';
import { ResponsavelRepository } from './src/data/repositories/ResponsavelRepository';
import { Responsavel } from './src/core/entities/Responsavel';

export default function App() {
  const [nome, setNome] = useState('');
  const [lista, setLista] = useState<Responsavel[]>([]);
  const [idEditando, setIdEditando] = useState<string | null>(null);

  // Instancia o repositório
  const repository = new ResponsavelRepository();

  // 1. Inicializa o Banco e carrega dados ao abrir
  useEffect(() => {
    initDatabase();
    carregarDados();
  }, []);

  // READ (Ler)
  const carregarDados = async () => {
    try {
      const dados = await repository.getAll();
      setLista(dados);
    } catch (error) {
      console.error("Erro ao carregar:", error);
    }
  };

  // CREATE (Criar) ou UPDATE (Atualizar)
  const handleSalvar = async () => {
    if (!nome.trim()) return Alert.alert("Erro", "Digite um nome");

    try {
      if (idEditando) {
        // Fluxo de Atualização
        await repository.update({
          id: idEditando,
          nome: nome
        });
        Alert.alert("Sucesso", "Responsável atualizado!");
      } else {
        // Fluxo de Criação
        const novoResponsavel: Responsavel = {
          id: uuidv4(),
          nome: nome
        };
        await repository.create(novoResponsavel);
      }

      // Limpa o formulário e recarrega a lista
      setNome('');
      setIdEditando(null);
      carregarDados();

    } catch (error) {
      Alert.alert("Erro", "Falha ao salvar no banco");
      console.error(error);
    }
  };

  // Preparar para Edição
  const handleEditar = (item: Responsavel) => {
    setNome(item.nome);
    setIdEditando(item.id);
  };

  // DELETE (Excluir - Soft Delete)
  const handleExcluir = async (id: string) => {
    try {
      await repository.delete(id);
      carregarDados(); // Recarrega a lista (o item deve sumir pois filtramos deletado_em IS NULL)
    } catch (error) {
      console.error(error);
    }
  };

  const handleCancelarEdicao = () => {
    setNome('');
    setIdEditando(null);
  };

  // Renderização de cada item da lista
  const renderItem = ({ item }: { item: Responsavel }) => (
    <View style={styles.card}>
      <View>
        <Text style={styles.cardTitle}>{item.nome}</Text>
        <Text style={styles.cardSubtitle}>
          Status: {item.sincronizado ? "✅ Sincronizado" : "⏳ Pendente Sync"}
        </Text>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity onPress={() => handleEditar(item)} style={styles.btnEdit}>
          <Text style={styles.btnText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleExcluir(item.id)} style={styles.btnDelete}>
          <Text style={styles.btnText}>Excluir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Teste CRUD Responsável</Text>

      {/* Formulário */}
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Nome do Responsável"
          value={nome}
          onChangeText={setNome}
        />
        <View style={styles.row}>
          <TouchableOpacity style={styles.btnSave} onPress={handleSalvar}>
            <Text style={styles.btnText}>{idEditando ? "Atualizar" : "Adicionar"}</Text>
          </TouchableOpacity>

          {idEditando && (
            <TouchableOpacity style={styles.btnCancel} onPress={handleCancelarEdicao}>
              <Text style={styles.btnText}>Cancelar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Lista */}
      <FlatList
        data={lista}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>Nenhum responsável cadastrado.</Text>}
      />
    </SafeAreaView>
  );
}

// Estilos básicos para o teste ficar visível
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20, paddingTop: 50 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  form: { marginBottom: 20 },
  input: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#ddd' },
  row: { flexDirection: 'row', gap: 10 },
  btnSave: { flex: 1, backgroundColor: '#007AFF', padding: 15, borderRadius: 8, alignItems: 'center' },
  btnCancel: { flex: 1, backgroundColor: '#666', padding: 15, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' },
  list: { paddingBottom: 20 },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: 'bold' },
  cardSubtitle: { fontSize: 12, color: '#666' },
  cardActions: { flexDirection: 'row', gap: 10 },
  btnEdit: { backgroundColor: '#FF9500', padding: 8, borderRadius: 5 },
  btnDelete: { backgroundColor: '#FF3B30', padding: 8, borderRadius: 5 },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 20 }
});