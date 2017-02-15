;(function()
{
    function SimpleCompiler()
    {
        this.ast = new window.simpleAst();
        this.variables = {};
        this.memCounter = 0;
        this.registers = [];
        this.numRegisters = 8;
        this.registerAccessCounter = 1;

        for (var i = 0; i < this.numRegisters; i++)
        {
            this.registers.push(new Register(i));
        }

        this.output = [];
    }
    var fn = SimpleCompiler.prototype;

    fn.create = function()
    {
        var sast = window.simpleAst;
        var value = new sast.immediateValue('int', 5);
        var setVar = new sast.getVar('', 'x');
        var assign = new sast.assign(setVar, value);

        this.ast.rootNodes.push(assign);

        value = new sast.immediateValue('int', 8);
        setVar = new sast.getVar('', 'y');
        assign = new sast.assign(setVar, value);
        
        this.ast.rootNodes.push(assign);
        
        var getVar = new sast.getVar('x');
        var add = new sast.add(setVar, getVar);
        
        this.ast.rootNodes.push(add);
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
    fn.getRegister = function(variable)
    {
       for (var i = 0; i < this.registers.length; i++)
       {
           var register = this.registers[i];
           if (register.variable === variable)
           {
               register.lastAccess = this.registerAccessCounter++;
               return register;
           }
       }

       return null;
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
        this.output = [];

        for (var i = 0; i < this.ast.rootNodes.length; i++)
        {
            var node = this.ast.rootNodes[i];
            this.compileNode(node);
        }

        console.log('Output: ', this.output.join('\n'));
    }

    fn.compileNode = function(node)
    {
        if (node instanceof simpleAst.assign)
        {
            var register = this.compileGetNode(node.destNode);
            this.output.push('MOV r' + register.registerNumber + ' ' + this.compileValueNode(node.valueNode));
        }
        else if (node instanceof simpleAst.add)
        {
            var register = this.compileGetNode(node.destNode);
            this.output.push('ADD r' + register.registerNumber + ' ' + this.compileValueNode(node.valueNode));
        }
    }
    fn.compileGetNode = function(node)
    {
        var variable = this.getVariable(node.fullname);
        return this.compileGetRegister(variable);
    }
    fn.compileValueNode = function(node)
    {
        if (node instanceof simpleAst.immediateValue)
        {
            return node.value;
        }
        else if (node instanceof simpleAst.getVar)
        {
            var register = this.compileGetNode(node);
            return 'r' + register.registerNumber;
        }
    }
    fn.compileGetRegister = function(variable)
    {
        var register = this.getRegister(variable);
        if (register == null)
        {
            register = this.getOldestRegister();
            if (register != null && register.variable != null)
            {
                this.output.push('MOV @' + register.variable.memoryPos + ' r' + register.registerNumber);
            }
            register.lastAccess = this.registerAccessCounter++;
            register.variable = variable;
        }
        return register;
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

    window.simpleCompiler = SimpleCompiler;

})();
