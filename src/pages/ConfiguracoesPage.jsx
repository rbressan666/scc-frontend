import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import SetoresTab from '../components/configuracoes/SetoresTab';
import CategoriasTab from '../components/configuracoes/CategoriasTab';
import UnidadesTab from '../components/configuracoes/UnidadesTab';

const ConfiguracoesPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('setores');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            
            <div className="flex items-center">
              <img 
                src="/cadoz-logo.png" 
                alt="Cadoz Logo" 
                className="w-8 h-8 mr-3"
              />
              <h1 className="text-xl font-semibold text-gray-900">
                Configurações do Sistema
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Card>
            <CardHeader>
              <CardTitle>Configurações</CardTitle>
              <CardDescription>
                Gerencie setores, categorias e unidades de medida do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="setores">Setores</TabsTrigger>
                  <TabsTrigger value="categorias">Categorias</TabsTrigger>
                  <TabsTrigger value="unidades">Unidades de Medida</TabsTrigger>
                </TabsList>
                
                <TabsContent value="setores" className="mt-6">
                  <SetoresTab />
                </TabsContent>
                
                <TabsContent value="categorias" className="mt-6">
                  <CategoriasTab />
                </TabsContent>
                
                <TabsContent value="unidades" className="mt-6">
                  <UnidadesTab />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ConfiguracoesPage;

