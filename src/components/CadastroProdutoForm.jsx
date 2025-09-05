import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const CadastroProdutoForm = ({ 
  productData, 
  onSave, 
  onCancel, 
  setores = [], 
  categorias = [], 
  unidades = [] 
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Dados do produto pai
    nome_produto: '',
    id_categoria: '',
    id_setor: '',
    
    // Dados da variação
    nome_variacao: '',
    estoque_atual: '0',
    estoque_minimo: '10',
    preco_custo: '0',
    fator_prioridade: '3',
    id_unidade_controle: ''
  });

  // Preencher formulário com dados do produto encontrado
  useEffect(() => {
    if (productData) {
      setFormData(prev => ({
        ...prev,
        nome_produto: productData.suggested_name || '',
        nome_variacao: productData.suggested_variation_name || '',
        // Tentar mapear categoria sugerida
        id_categoria: findCategoryByName(productData.suggested_category) || ''
      }));
    }
  }, [productData, categorias]);

  // Função para encontrar categoria por nome
  const findCategoryByName = (categoryName) => {
    if (!categoryName || !categorias.length) return null;
    
    const found = categorias.find(cat => 
      cat.nome.toLowerCase().includes(categoryName.toLowerCase()) ||
      categoryName.toLowerCase().includes(cat.nome.toLowerCase())
    );
    
    return found ? found.id : null;
  };

  // Atualizar campo do formulário
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Validar formulário
  const validateForm = () => {
    const errors = [];
    
    if (!formData.nome_produto.trim()) {
      errors.push('Nome do produto é obrigatório');
    }
    
    if (!formData.nome_variacao.trim()) {
      errors.push('Nome da variação é obrigatório');
    }
    
    if (!formData.id_categoria) {
      errors.push('Categoria é obrigatória');
    }
    
    if (!formData.id_setor) {
      errors.push('Setor é obrigatório');
    }
    
    if (!formData.id_unidade_controle) {
      errors.push('Unidade de controle é obrigatória');
    }
    
    if (parseFloat(formData.preco_custo) < 0) {
      errors.push('Preço de custo deve ser maior ou igual a zero');
    }
    
    if (parseFloat(formData.estoque_atual) < 0) {
      errors.push('Estoque atual deve ser maior ou igual a zero');
    }
    
    if (parseFloat(formData.estoque_minimo) < 0) {
      errors.push('Estoque mínimo deve ser maior ou igual a zero');
    }
    
    const prioridade = parseInt(formData.fator_prioridade);
    if (prioridade < 1 || prioridade > 5) {
      errors.push('Fator de prioridade deve ser entre 1 e 5');
    }
    
    return errors;
  };

  // Salvar produto
  const handleSave = async () => {
    const errors = validateForm();
    
    if (errors.length > 0) {
      toast({
        title: "Erro de validação",
        description: errors.join(', '),
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Preparar dados para envio
      const productPayload = {
        produto: {
          nome: formData.nome_produto.trim(),
          id_categoria: formData.id_categoria,
          id_setor: formData.id_setor,
          ativo: true
        },
        variacao: {
          nome: formData.nome_variacao.trim(),
          estoque_atual: parseFloat(formData.estoque_atual),
          estoque_minimo: parseFloat(formData.estoque_minimo),
          preco_custo: parseFloat(formData.preco_custo),
          fator_prioridade: parseInt(formData.fator_prioridade),
          id_unidade_controle: formData.id_unidade_controle,
          ativo: true
        },
        ean_code: productData?.ean_code || null
      };
      
      await onSave(productPayload);
      
      toast({
        title: "Sucesso",
        description: "Produto cadastrado com sucesso!",
      });
      
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      toast({
        title: "Erro",
        description: "Erro ao cadastrar produto. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* Header com imagem do produto */}
      {productData?.image_url && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <img 
                src={productData.image_url} 
                alt="Produto encontrado"
                className="w-20 h-20 object-cover rounded-lg border"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <div>
                <h3 className="font-medium">Produto encontrado</h3>
                <p className="text-sm text-gray-500">
                  EAN: {productData.ean_code}
                </p>
                {productData.brands && (
                  <p className="text-sm text-gray-500">
                    Marca: {productData.brands}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulário de cadastro */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Cadastro de Produto
              </CardTitle>
              <CardDescription>
                Preencha os dados do produto e sua primeira variação
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Dados do Produto Pai */}
          <div className="space-y-4">
            <h4 className="font-medium text-lg border-b pb-2">Dados do Produto</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="nome_produto">Nome do Produto *</Label>
                <Input
                  id="nome_produto"
                  value={formData.nome_produto}
                  onChange={(e) => handleInputChange('nome_produto', e.target.value)}
                  placeholder="Ex: Coca-Cola - Refrigerante Sabor Cola"
                />
              </div>
              
              <div>
                <Label htmlFor="categoria">Categoria *</Label>
                <Select 
                  value={formData.id_categoria} 
                  onValueChange={(value) => handleInputChange('id_categoria', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((categoria) => (
                      <SelectItem key={categoria.id} value={categoria.id}>
                        {categoria.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="setor">Setor *</Label>
                <Select 
                  value={formData.id_setor} 
                  onValueChange={(value) => handleInputChange('id_setor', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um setor" />
                  </SelectTrigger>
                  <SelectContent>
                    {setores.map((setor) => (
                      <SelectItem key={setor.id} value={setor.id}>
                        {setor.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Dados da Variação */}
          <div className="space-y-4">
            <h4 className="font-medium text-lg border-b pb-2">Dados da Variação</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="nome_variacao">Nome da Variação *</Label>
                <Input
                  id="nome_variacao"
                  value={formData.nome_variacao}
                  onChange={(e) => handleInputChange('nome_variacao', e.target.value)}
                  placeholder="Ex: Lata 350ml"
                />
              </div>
              
              <div>
                <Label htmlFor="unidade_controle">Unidade de Controle *</Label>
                <Select 
                  value={formData.id_unidade_controle} 
                  onValueChange={(value) => handleInputChange('id_unidade_controle', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {unidades.map((unidade) => (
                      <SelectItem key={unidade.id} value={unidade.id}>
                        {unidade.nome} ({unidade.sigla})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="fator_prioridade">Fator de Prioridade *</Label>
                <Select 
                  value={formData.fator_prioridade} 
                  onValueChange={(value) => handleInputChange('fator_prioridade', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Muito Baixa</SelectItem>
                    <SelectItem value="2">2 - Baixa</SelectItem>
                    <SelectItem value="3">3 - Média</SelectItem>
                    <SelectItem value="4">4 - Alta</SelectItem>
                    <SelectItem value="5">5 - Muito Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="estoque_atual">Estoque Atual</Label>
                <Input
                  id="estoque_atual"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.estoque_atual}
                  onChange={(e) => handleInputChange('estoque_atual', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="estoque_minimo">Estoque Mínimo</Label>
                <Input
                  id="estoque_minimo"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.estoque_minimo}
                  onChange={(e) => handleInputChange('estoque_minimo', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="preco_custo">Preço de Custo (R$)</Label>
                <Input
                  id="preco_custo"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.preco_custo}
                  onChange={(e) => handleInputChange('preco_custo', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Botões de ação */}
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handleSave} 
              disabled={loading}
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Salvando...' : 'Salvar Produto'}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={onCancel}
              disabled={loading}
            >
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CadastroProdutoForm;

