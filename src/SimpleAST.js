;(function()
{
    // Nodes {{{
    function BaseNode()
    {

    }

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

    function ConditionNode(node)
    {
        this.node = node;
    }
    ConditionNode.prototype = Object.create(BaseNode.prototype);
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

    window.simpleAst = SimpleAST;
})();
