;(function()
{
    // Nodes {{{
    function BaseNode()
    {

    }

    function StatementBlockNode()
    {
        this.nodes = [];
    }
    StatementBlockNode.prototype = Object.create(BaseNode.prototype);

    function AssignNode(destNode, valueNode)
    {
        this.destNode = destNode;
        this.valueNode = valueNode;
    }
    AssignNode.prototype = Object.create(BaseNode.prototype);

    // Variables {{{
    function VariableNode(scope, variableName)
    {
        this.scope = scope;
        this.variableName = variableName;
        this.fullname = variableName + '@' + (scope ? scope : '__global');
    }
    VariableNode.prototype = Object.create(BaseNode.prototype);
    function SetVariableNode(scope, variableName)
    {
        VariableNode.call(this, scope, variableName);
    }
    SetVariableNode.prototype = Object.create(VariableNode.prototype);
    function GetVariableNode(scope, variableName)
    {
        VariableNode.call(this, scope, variableName);
    }
    GetVariableNode.prototype = Object.create(VariableNode.prototype);
    function DeclareNode(scope, variableName, type)
    {
        VariableNode.call(this, scope, variableName);
        this.type = type;
    }
    DeclareNode.prototype = Object.create(VariableNode.prototype);
    // }}}

    function ImmediateValueNode(type, value)
    {
        this.type = type;
        this.value = value;
    }
    ImmediateValueNode.prototype = Object.create(BaseNode.prototype);

    function AddNode(destNode, valueNode)
    {
        this.destNode = destNode;
        this.valueNode = valueNode;
    }

    function ConditionNode(compareNode, trueNode)
    {
        this.compareNode = compareNode;
        this.trueNode = trueNode;
    }
    ConditionNode.prototype = Object.create(BaseNode.prototype);

    function CompareNode(node1, node2, comparison)
    {
        this.node1 = node1;
        this.node2 = node2;
        this.comparison = comparison;
    }
    CompareNode.equals = function(node1, node2)
    {
        return new CompareNode(node1, node2, 'equals');
    }
    CompareNode.notEquals = function(node1, node2)
    {
        return new CompareNode(node1, node2, 'notEquals'); 
    }
    CompareNode.prototype = Object.create(BaseNode.prototype);

    function LoopNode(compareNode, loopBody)
    {
        this.compareNode = compareNode;
        this.loopBody = loopBody;
    }
    LoopNode.prototype = Object.create(BaseNode.prototype);

    function ForLoopNode(compareNode, initialNode, iterationNode, loopBody)
    {
        this.compareNode = compareNode;
        this.initialNode = initialNode;
        this.iterationNode = iterationNode;
        this.loopBody = loopBody;
    }
    ForLoopNode.prototype = Object.create(BaseNode.prototype);
    // }}}
    
    function SimpleAST()
    {
        this.rootNodes = [];
    }
    SimpleAST.declareVar = DeclareNode
    SimpleAST.setVar = SetVariableNode;
    SimpleAST.getVar = GetVariableNode;
    SimpleAST.condition = ConditionNode;
    SimpleAST.immediateValue = ImmediateValueNode;
    SimpleAST.assign = AssignNode;
    SimpleAST.add = AddNode;
    SimpleAST.compare = CompareNode;
    SimpleAST.statement = StatementBlockNode;
    SimpleAST.loop = LoopNode;
    SimpleAST.forLoop = ForLoopNode;

    window.simpleAst = SimpleAST;
})();
