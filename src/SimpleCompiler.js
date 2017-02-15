;(function()
{
    function SimpleCompiler()
    {
        this.ast = new window.simpleAst();
        this.variables = {};
        this.memCounter = 0;
        this.registers = {};
        this.numRegisters = 8;
        this.registerAccessCounter = 0;
        this.numRegistersInUse = 0;

        this.output = [];
    }
    var fn = SimpleCompiler.prototype;

    fn.create = function()
    {
        var sast = window.simpleAst;
        var value = new sast.immediateValue('int', 5);
        var declare = new sast.declareVar('', 'x', 'int');
        var setVar = new sast.getVar('', 'x');
        var assign = new sast.assign(declare, setVar);

        this.ast.rootNodes.push(declare);
        this.ast.rootNodes.push(assign);
    }

    fn.getVariable = function(fullname)
    {
        var result = this.variables[fullname];
        if (!result)
        {
            result = this.variables[fullname] = new Variable(fullname, this.memCounter++);
        }
        return result;
    }
    fn.getRegister = function(fullname)
    {
        var inRegister = this.registers[fullname];
        if (inRegister)
        {
            return inRegister;
        }

        if (this.numRegistersInUse >= this.numRegisters)
        {
            var oldest = this.getOldestRegister();
            this.output.push()
        }
    }
    fn.getOldestRegister = function()
    {
        var min = null;
        for (var fullname in this.registers)
        {
            var register = this.registers[fullname];
            if (min == null || register.lastAccess < min.lastAccess)
            {
                min = register;
            }
        }
        return min;
    }

    fn.compile = function()
    {
        
    }

    fn.compileNode = function(node)
    {
        if (node instanceof simpleAst.assign)
        {
            this.compileNode(node.destNode);
            this.compileGetNode(node.valueNode, 0);
            this.output.push('MOV @r1 r0');
        }
        else if (node instanceof simpleAst.getVar)
        {
            var variable = this.getVariable(node.fullname);
            this.output.push('MOV r1 ' + variable.memoryPos);
        }
        else if (node instanceof simpleAst.immediateValue)
        {
            this.output.push('MOV r0 ' + node.value);
        }
        else if (node instanceof simpleAst.add)
        {
            //this.compileGetNode(simpleAst.)
        }
    }
    fn.compileGetNode(node, register)
    {
        var variable = this.getVariable(node.fullname);
        this.output.push('MOV r' + register + ' ' + variable.memoryPos);
    }

    var inMemoryPos = 'inMemory';
    var inRegisterPos = 'inRegister';
    function Variable(fullname, memoryPos)
    {
        this.fullname = fullname;
        this.position = inMemoryPos;
        this.memoryPos = memoryPos;
    }

    function Register(regNumber)
    {
        this.lastAccess = 0;
        this.variable = null;
        this.registerNumber = regNumber;
    }

    window.simpleCompiler = Compiler;

})();
